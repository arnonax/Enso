import { Route, Get, Put, Query, Body } from "tsoa";
import { Image, imageModel } from "../model/image";
import { app } from "../app";
import { verifyToken } from "../authentication/auth";

// TODO: find a way to remove the duplication between the way the routes are defined using the `app` functions
// below, and the annotations on ImageController.

@Route("image")
export class ImageContoller {
    
    @Get("{id}")
    public async getById(id: string) : Promise<Image> {
        const result = await imageModel.findOne({id});
        return ImageContoller.removeMongoMembers(result);
    }

    @Get()
    public async get(
        @Query() offset : number, @
        Query() limit : number
    ) : Promise<Image[]> {
        const queryOptions = { skip: offset, limit };
        const results = await imageModel.find(null, null, queryOptions);
        return results.map(result => ImageContoller.removeMongoMembers(result));
    }

    @Put()
    public async upsert(@Body() image: Image) : Promise<Image> {
        const creteria = { id: image.id };
        const body = {...image, $set: {}};
        body.metadata = undefined;
        for(const key in image.metadata) {
            body.$set["metadata." + key] = image.metadata[key];
        }

        const result = await imageModel.findOneAndUpdate(creteria, body, {new: true, upsert: true});
        return ImageContoller.removeMongoMembers(result);
    }

    @Get("combinations")
    public async getCombinations(@Query() length: number) : Promise<Image[][]> {
        const allImages = (await imageModel.find())
            .map(result => ImageContoller.removeMongoMembers(result));

        return this.getCombinationsRecursive(allImages, length);
    }

    private getCombinationsRecursive(images: Image[], length: number) : Image[][] {
        if (length > images.length)
             return [];

        if (length == 1)
             return images.map(image => [image]);
        
        if (length == 0)
            return [[]];
        
        const rest = images.slice(1);
        
        const restCombinations = this.getCombinationsRecursive(rest, length - 1);
        const combinationsIncluding1stElement = restCombinations.map(combination => [images[0], ...combination]);
        const combinationsExcluding1stElement = this.getCombinationsRecursive(rest, length);
        return combinationsIncluding1stElement.concat(combinationsExcluding1stElement);
    }

    private static removeMongoMembers(mongoObject: any) : Image {
        const obj = mongoObject.toObject();
        delete obj["__v"];
        delete obj["_id"];
        return obj;
    }
};

app.put("/image", verifyToken, async (req, res) => {
    const image = req.body;
    if (!(image.id && image.name && image.repository && image.version)) {
        return res.status(400).send("Required fields are missing");
    }
    
    try {
        const result = await new ImageContoller().upsert(image);
        return res.status(200).json(result);
    } catch (err) {
        if (err.codeName === "DuplicateKey") {
            return res.status(400).send(err.message);
        }
        console.log(err);
        return res.status(500).send(err.message);
    }
});

app.get("/image/combinations", verifyToken, async(req, res) => {

    const length = parseInt(<string>req.query.length);
    if(isNaN(length) || length < 0 || !Number.isInteger(length))
        return res.status(400).send("'length' must be a non-negative integer");
    
    const controller = new ImageContoller();
    const result = await controller.getCombinations(length);
    
    return res.status(200).json(result);
});

app.get("/image/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    const result = await new ImageContoller().getById(id);
    if (!result) {
        return res.status(404).send(`Image with id ${id} not found`);
    }
    return res.status(200).json(result);
});

app.get("/image", verifyToken, async (req, res) => {
    // TODO: extract the validation logic into a separate class and add tests for it
    let offset : number;
    if (!req.query.offset)
        offset = 0;
    else
    {
        offset = parseInt(<string>req.query.offset);
        if (isNaN(offset) || offset < 0 || !Number.isInteger(offset))
            return res.status(400).send("offset must be a non-negative integer");
    }

    let limit : number;
    if (!req.query.limit)
        limit = 20;
    else
    {
        limit = parseInt(<string>req.query.limit);
        if(isNaN(limit) || limit < 0 || !Number.isInteger(limit))
            return res.status(400).send("limit must be a non-negative integer");
    }

    if(limit > 100)
        return res.status(413).send("Page size too big");

    const result = await new ImageContoller().get(offset, limit);
    return res.status(200).json(result);
});