import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../model/user";
import { app } from "../app";

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!(email && password)) {
            return res.status(400).send("All input is required");
        }

        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h"
                }
            );

            user.token = token;
            return res.status(200).json(user);
        }
        return res.status(400).send("Invalid credentials");
    }
    catch (err) {
        console.log(err);
    }
});
