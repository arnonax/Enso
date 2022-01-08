import mongoose from "mongoose";

const { MONGO_URI } = process.env;

export const connect = async () => {
    // Connecting to the database
    try {
        await mongoose.connect(MONGO_URI!, {
            //useNewUrlParser: true,
            //useUnifiedTopology: true,
            //userCreateIndex: true,
            //useFindAndModify: false
        });
        console.log("Successfully connected to database");
    }
    catch(error) {
        console.log("database connection failed. exiting now...");
        console.error(error);
        process.exit(1);
    }
}