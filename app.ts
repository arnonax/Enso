require("dotenv").config();
require("./config/database").connect(process.env.MONGO_URI);
import express, { response } from "express";

export const app = express();

app.use(express.json());


import "./authentication/registration";
import "./authentication/login";

import {verifyToken} from "./authentication/auth";

import "./image/imageController";

//#region Welcome - example entry point
import { Get, Route } from "tsoa";

interface WelcomeResponse {
    message: string
};

@Route("welcome")
class WelcomeController
{
    @Get("/")
    public async welcome() : Promise<WelcomeResponse> {
        return {message: "Welcome!"}
    }
}

app.get("/welcome", verifyToken, async (req, res) => {
    return res.send(await new WelcomeController().welcome());
});
//#endregion

import swaggerUi from "swagger-ui-express";
app.use(express.json());
app.use(express.static("public"));

app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
        swaggerOptions: {
            url: "/swagger.json"
        },
    })
);
