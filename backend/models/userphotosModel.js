import mongoose from "mongoose";

const userphotoScehma = mongoose.Schema(
    {
    data: {
        type: String,
        required: true,
    },
    },
    
    {
        timestamps: true,
    }
);

export const UserPhotos = mongoose.model(
    "User Photo Element",
    userphotoScehma,
    "userphoto-collection"
);
