import mongoose from "mongoose";

const alertSchema = mongoose.Schema(
    {
    AlertName: {
        type: String,
        required: true,
    },
    Description: {
        type: String,
        required: true,
    }
    },
    {
        timestamps: true,
    }
);

export const Alerts = mongoose.model(
    "Alert Element",
    alertSchema,
    "alert-collection"
);
