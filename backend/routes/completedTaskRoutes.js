import express from 'express';

import { CompletedTask } from '../models/completedTaskModel.js';


const router = express.Router();

// Get all completed tasks
router.get("/", async(req, res) => {
    try {
        const completedTaskElements = await CompletedTask.find({}).populate('CompletedBy').populate('Task');

        return res.status(200).json({
            count: completedTaskElements.length,
            data: completedTaskElements
        });
    } catch(err) {
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Get all tasks completed by a specific member
router.get("/:userId", async(req, res) => {
    try {
        const { userId } = req.params;

        const userCompletedTasks = await CompletedTask.find({ CompletedBy: userId }).populate('CompletedBy').populate('Task');
        return res.status(200).json(userCompletedTasks);
    } catch(err) {
        console.log(err.message);
        return res.status(500).send({ message: err.message });
    }
});

// Get all the members who have completed a certain task
router.get("/task/:taskId", async(req, res) => {
    try {
        const { taskId } = req.params;

        const usersWhoCompletedTask = await CompletedTask.find({ Task: taskId }).populate('CompletedBy').populate('Task');
        return res.status(200).json(usersWhoCompletedTask);
    } catch(err) {
        console.log(err.message);
        return res.status(500).send({ message: err.message});
    }
});

// Create a new completed task
router.post("/", async(req, res) => {
    try {
        const {
            CompletedBy,
            Task
        } = req.body;

        if(!CompletedBy || !Task) {
            return res.status(400).send("Send valid ObjectIds");
        }

        const completedTask = new CompletedTask({
            CompletedBy,
            Task
        });

        await completedTask.save();
        return res.status(200).send("Completed Task saved successfully");
    } catch(err) {
        console.log(err.message);
        return res.status(500).send({ message: err.message});
    }
});

export default router;