import mongoose from 'mongoose';

const completedTaskSchema = mongoose.Schema({
    CompletedBy: { type: mongoose.Schema.ObjectId, ref: 'User Element', required: true }, 
    Task: { type: mongoose.Schema.ObjectId, ref: 'Tasks Element', required: true },
    },
    {
        timestamps: true
    }
);

export const CompletedTask = mongoose.model(
    "Completed Task Element",
    completedTaskSchema,
    "completed-task-collection"
)