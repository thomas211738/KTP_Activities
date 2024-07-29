import mongoose from "mongoose";
import { Users } from "../models/userModel.js";
import { config } from "dotenv";
config();

const mongoDBURL = process.env.mongoDBURL;
console.log(mongoDBURL);

mongoose.connect(mongoDBURL);

const updateDS = async () => {
    const ds_majors = await Users.updateMany({ Major: "MechE " }, { $set: {"Major.$": "Mechanical Engineering"} });
    console.log(ds_majors.modifiedCount);
    console.log(ds_majors.matchedCount);
}

const updateCS = async () => {
    const cs_majors = await Users.updateMany({ Minor: "Econ"  }, { $set: {"Minor.$": "Economics"} });
    console.log(cs_majors.modifiedCount);
    console.log(cs_majors.matchedCount);
}

await updateDS();
await updateCS();

mongoose.connection.close();