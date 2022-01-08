var expect = require('chai').expect
require("dotenv").config();
import { ClientSession, connect, Document, LeanDocument, Model, Mongoose, Types } from "mongoose";
import { Image, imageModel } from "../model/image";
import "../config/database";
import "../image/imageController";
import { ImageContoller } from "../image/imageController";

describe("image integration test", function () {
    let connection: Mongoose;
    let session: ClientSession = null;
    let sut: ImageContoller;
    this.timeout(30000);

    before(async function() {
        connection = await connect(process.env.MONGO_URI);
        session = await connection.startSession();

        sut = new ImageContoller()
    });

    beforeEach(async function() {
        session.startTransaction();

        await imageModel.deleteMany({});
    })

    afterEach(async function() {
        await session.abortTransaction();
    })
        
    after(async function() {
        await session.endSession();
        await connection.disconnect();
    })

    it("should be saved to db", async () => {

        const imageData = dummyImage();
        
        const result = await sut.upsert(imageData);
        
        expect(removeMongoMembers(result)).to.eql(imageData);
    });

    it("should update if already exists", async () => {
        const imageData = dummyImage();
        
        await sut.upsert(imageData);
        imageData.name = "newName";
        const updatedResult = await sut.upsert(imageData);

        expect(removeMongoMembers(updatedResult)).to.eql(imageData);
    });

    it("should merge metadata", async () => {
        const imageData = dummyImage();
        imageData.metadata = {a:1, b:2}
        
        await sut.upsert(imageData);

        imageData.metadata = {b:3, c:4};
        const updatedResult = await sut.upsert(imageData);

        expect(removeMongoMembers(updatedResult)["metadata"]).to.eql({a:1, b:3, c:4});
    });

    function dummyImage() : Image {
        return {
            id: "1234",
            name: "dummy Image",
            repository: "dummy repo",
            version: "dummy version"
        };
    }    

    function removeMongoMembers(mongoObject: any) : object {
        const obj = mongoObject.toObject();
        delete obj["__v"];
        delete obj["_id"];
        return obj;
    }
    
});