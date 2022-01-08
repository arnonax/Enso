import mongoose from "mongoose";

export const connect = async (mongoUri: string) => {
    // Connecting to the database
    try {
        await mongoose.connect(mongoUri!, {
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