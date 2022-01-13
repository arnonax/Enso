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
        
        expect(result).to.eql(imageData);
    });

    it("should update if already exists", async () => {
        const imageData = dummyImage();
        
        await sut.upsert(imageData);
        imageData.name = "newName";
        const updatedResult = await sut.upsert(imageData);

        expect(updatedResult).to.eql(imageData);
    });

    it("should merge metadata", async () => {
        const imageData = dummyImage();
        imageData.metadata = {a:1, b:2}
        
        await sut.upsert(imageData);

        imageData.metadata = {b:3, c:4};
        const updatedResult = await sut.upsert(imageData);

        expect(updatedResult.metadata).to.eql({a:1, b:3, c:4});
    });

    it("should get image by id",async () => {
        const imageData = dummyImage();
        await sut.upsert(imageData);

        const result = await sut.getById(imageData.id);
        expect(result).to.eql(imageData);
    });

    it("should get all images when limit > # of items", async() => {
        const images : Image[] = [
            {...dummyImage(), ...{id: "123", name: "A"}},
            {...dummyImage(), ...{id: "124", name: "B"}},
            {...dummyImage(), ...{id: "125", name: "C"}},
        ];
        await insertImages(images, sut);

        const result = await sut.get(0, 5);
        expect(result.length).to.eq(3);
        expect(result).to.eql(images);
    });

    it("should limit images according to parameter", async() => {
        const images : Image[] = [
            {...dummyImage(), ...{id: "123", name: "A"}},
            {...dummyImage(), ...{id: "124", name: "B"}},
            {...dummyImage(), ...{id: "125", name: "C"}},
        ];
        await insertImages(images, sut);

        const result = await sut.get(0, 2);
        expect(result.length).to.eq(2);
        const expectedResult = [images[0], images[1]];
        expect(result).to.eql(expectedResult);
    });

    it("should skip images according to parameter", async() => {
        const images : Image[] = [
            {...dummyImage(), ...{id: "123", name: "A"}},
            {...dummyImage(), ...{id: "124", name: "B"}},
            {...dummyImage(), ...{id: "125", name: "C"}},
        ];
        await insertImages(images, sut);

        const result = await sut.get(2, 2);
        expect(result.length).to.eq(1);
        const expectedResult = [images[2]];
        expect(result).to.eql(expectedResult);
    });

    function dummyImage() : Image {
        return {
            id: "1234",
            name: "dummy Image",
            repository: "dummy repo",
            version: "dummy version"
        };
    }        

    async function insertImages(images: Image[], sut: ImageContoller) {
        for (const image of images) {
            await sut.upsert(image);
        }
    }    
});