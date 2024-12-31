import mongoose from "mongoose";

const websitePicScehma = mongoose.Schema(
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

export const websitePics = mongoose.model(
    "Brother Pitures Element",
    websitePicScehma,
    "websitepics-collection"
);