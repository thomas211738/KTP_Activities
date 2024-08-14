import mongoose from "mongoose";

const eventSchema = mongoose.Schema(
    {
    Name: {
        type: String,
        required: true,
    },
    Day: {
        type: String,
        required: true,
    },
    Time: {
        type: String,
        required: true,
    },
    Location: {
        type: String,
        required: true,
    },
    Description: {
        type: String,
        required: true,
    },
    Position: {
        type: Number,
        required: true,
    }
    },
    {
        timestamps: true,
    }
);

export const Events = mongoose.model(
    "Event Element",
    eventSchema,
    "event-collection"
);