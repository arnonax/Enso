import mongoose from "mongoose";

export interface Image
{
    id: string,
    name: string,
    repository: string,
    version: string,
    metadata?: object
};

const imageSchema = new mongoose.Schema<Image>({
    id: {type: String, required: true, unique: true },
    name: {type: String, required: true, unique: true},
    repository: {type: String, required:true},
    version: {type: String},
    metadata: {type: Object},
});

export const imageModel = mongoose.model("image", imageSchema);