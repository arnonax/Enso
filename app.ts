require("dotenv").config();
require("./config/database").connect();
import express from "express";

export const app = express();

app.use(express.json());


import "./authentication/registration";
import "./authentication/login";

import {verifyToken} from "./authentication/auth";

app.post("/welcome", verifyToken, (req, res) => {
    res.status(200).send(`Welcome!`);
});