import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
    BUEmail: {
        type: String,
        required: true,
    },
    FirstName: {
        type: String,
        required: true,
    },
    LastName: {
        type: String,
        required: true,
    },
    GradYear: {
        type: Number,
        required: true,
    },
    Colleges: {
        type: [String],
        required: true,
    },
    Major: {
        type: [String],
        required: true,
    },
    Minor: {
        type: [String],
        required: false,
    },
    PhoneNumber: {
        type: String,
        required: true,
    },
    Birthday: { 
        type: String,
        required: true,
    },
    Position: {
        type: Number,
        required: true,
    },
    },
    {
        timestamps: true,
    }
);

export const Users = mongoose.model(
    "User Element",
    userSchema,
    "user-collection"
);