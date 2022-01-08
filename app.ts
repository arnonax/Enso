require("dotenv").config();
require("./config/database").connect();
import express, { response } from "express";

export const app = express();

app.use(express.json());


import "./authentication/registration";
import "./authentication/login";

import {verifyToken} from "./authentication/auth";

import { Get, Route } from "tsoa";
interface WelcomeResponse {
    message: string
};

//#region Welcome - example entry point
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
