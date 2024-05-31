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
    Majors: {
        type: [String],
        required: true,
    },
    Minors: {
        type: [String],
        required: false,
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