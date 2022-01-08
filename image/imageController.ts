import { Post, Route } from "tsoa";
import { Image, imageModel } from "../model/image";
import { app } from "../app";
import { verifyToken } from "../authentication/auth";
import { Query } from "mongoose";

@Route("image")
export class ImageContoller {
    @Post()
    public async upsert(image: Image) : Promise<Query<Image, {}>> {
        const creteria = { id: image.id };
        const body = {...image, $set: {}};
        body.metadata = undefined;
        for(const key in image.metadata) {
            body.$set["metadata." + key] = image.metadata[key];
        }

        return await imageModel.findOneAndUpdate(creteria, body, {new: true, upsert: true});
    }
};

app.post("/image", verifyToken, async (req, res) => {
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