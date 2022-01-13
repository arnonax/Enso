import { Route, Get, Put } from "tsoa";
import { Image, imageModel } from "../model/image";
import { app } from "../app";
import { verifyToken } from "../authentication/auth";

@Route("image")
export class ImageContoller {
    
    @Get()
    public async getById(id: string) : Promise<Image> {
        const result = await imageModel.findOne({id});
        return ImageContoller.removeMongoMembers(result);
    }

    @Get()
    public async get(offset : number, limit : number) : Promise<Image[]> {
        const queryOptions = { skip: offset, limit };
        const results = await imageModel.find(null, null, queryOptions);
        return results.map(result => ImageContoller.removeMongoMembers(result));
    }

    @Put()
    public async upsert(image: Image) : Promise<Image> {
        const creteria = { id: image.id };
        const body = {...image, $set: {}};
        body.metadata = undefined;
        for(const key in image.metadata) {
            body.$set["metadata." + key] = image.metadata[key];
        }

        const result = await imageModel.findOneAndUpdate(creteria, body, {new: true, upsert: true});
        return ImageContoller.removeMongoMembers(result);
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

app.get("/image/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    const result = await new ImageContoller().getById(id);
    if (!result) {
        return res.status(404).send(`Image with id ${id} not found`);
    }
    return res.status(200).json(result);
});

app.get("/image", verifyToken, async (req, res) => {
    // TODO: extract the validation logic into a separate class
    let offset : number;
    if (!req.query.offset)
        offset = 0;
    else
    {
        offset = parseInt(<string>req.query.offset);
        if (isNaN(offset) || offset < 0)
            return res.status(400).send("offset must be a non-negative value");
    }

    let limit : number;
    if (!req.query.limit)
        limit = 20;
    else
    {
        limit = parseInt(<string>req.query.limit);
        if(isNaN(limit) || limit < 0)
            return res.status(400).send("limit must be a non-negative value");
    }

    if(limit > 100)
        return res.status(413).send("Page size too big");

    const result = await new ImageContoller().get(offset, limit);
    return res.status(200).json(result);
});