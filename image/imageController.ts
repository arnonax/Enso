import { Route, Get, Put } from "tsoa";
import { Image, imageModel } from "../model/image";
import { app } from "../app";
import { verifyToken } from "../authentication/auth";

@Route("image")
export class ImageContoller {
    @Get()
    public async getById(id: string) : Promise<Image> {
        throw new Error("Method not implemented.");
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
        return this.removeMongoMembers(result);
    }

    private removeMongoMembers(mongoObject: any) : Image {
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

app.get("/image/:id", async (req, res) => {
    const id = req.params.id;
    const result = await new ImageContoller().getById(id);
    if (!result) {
        return res.status(404).send(`Image with id ${id} not found`);
    }
    return res.status(200).json(result);
});