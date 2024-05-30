import mongoose from "mongoose";

const taskSchema = mongoose.Schema(
    {
    TaskName: {
        type: String,
        required: true,
    },
    Completed: {
        type: Boolean,
        required: true,
    },
    Mandatory: {
        type: Boolean,
        required: true, 
    }, 
    ParticipantsNeeded: {
        type: String,
        requred: true,
    },
    Description: {
        type: String,
        required: true,
    },
    PointsWorth: {
        type: Number,
        required: false,
    },
    },
    {
        timestamps: true,
    }
    );

    export const Tasks = mongoose.model(
    "Tasks Element",
    taskSchema,
    "task-collection"
);



