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
    PhoneNumber: {
        type: String,
        required: false,
    },
    Birthday: {
        type: String,
        required: false,
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
    Birthday: {
        type: String,
    },
    Position: {
        type: Number,
        required: true,
    },
    Interests: {
        type: [String]
    },
    LinkedIn: {
        type: String
    },
    Class: {
        type: String
    },
    Eboard_Position: {
        type: String
    },
    ProfilePhoto: {
        type: String
    },
    ExpoPushToken: String,
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
