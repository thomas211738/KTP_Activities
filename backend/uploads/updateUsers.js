import mongoose from "mongoose";
import { Users } from "../models/userModel.js";
import { config } from "dotenv";
config({path: '../.env'});

const mongoDBURL = process.env.mongoDBURL;

mongoose.connect(mongoDBURL, {
     useNewUrlParser: true, 
     useUnifiedTopology: true 
});

const updateDS = async () => {
    const ds_majors = await Users.updateMany({ Major: "DS" }, { $set: {"Major.$": "Data science"}});
    console.log(ds_majors.modifiedCount);
    console.log(ds_majors.matchedCount);
}

const updateCS = async () => {
    const cs_majors = await Users.updateMany({ Major: "CS" }, { $set: {"Major.$": "Computer science"} });
    console.log(cs_majors.modifiedCount);
    console.log(cs_majors.matchedCount);
}

await updateDS();
await updateCS();

mongoose.connection.close();