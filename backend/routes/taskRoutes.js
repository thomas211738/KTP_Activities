import express from "express";

import { Tasks } from "../models/tasksModel.js";

const router = express.Router();

// get all tasks
router.get("/", async (request, response) => {
    try {
        const tasksElements = await Tasks.find({});

        return response.status(200).json({
            count: tasksElements.length,
            data: tasksElements,
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// get a task by id
router.get("/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const task = await Tasks.findById(id);
        return response.status(200).json(task);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// add a task
router.post("/", async (request, response) => {
    try {
        const {
            TaskName,
            Completed,
            Mandatory,
            ParticipantsNeeded,
            Description,
            PointsWorth,
        } = request.body;

        if (
            !request.body.TaskName ||
            !request.body.Completed ||
            !request.body.Mandatory ||
            !request.body.ParticipantsNeeded ||
            !request.body.Description 
        ) {
            return response.status(400).send({
                message:
                    "Send all required fields: TaskName, Completed, Mandatory, ParticipantsNeeded, Description, PointsWorth",
            });
        }
        const newtask = new Tasks({
            TaskName,
            Completed,
            Mandatory,
            ParticipantsNeeded,
            Description,
            PointsWorth,
        });
        await newtask.save();
        return response
            .status(200)
            .send({ message: "task added successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// update a task
router.put("/:id", async (request, response) => {
    try {
        if (
            !request.body.TaskName ||
            !request.body.Completed ||
            !request.body.Mandatory ||
            !request.body.ParticipantsNeeded ||
            !request.body.Description ||
            !request.body.PointsWorth
        ) {
            return response.status(400).send({
                message:
                    "Send all required fields: TaskName, Completed, Mandatory, ParticipantsNeeded, Description, PointsWorth",
            });
        }
        const { id } = request.params;
        const result = await Tasks.findByIdAndUpdate(id, request.body);
        if (!result) {
            return response.status(404).json({ message: "task not found" });
        }
        return response
            .status(200)
            .send({ message: "task updated successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// delete a task
router.delete("/:id", async (request, response) => {
    try {
        await Tasks.findByIdAndDelete(request.params.id);
        return response
            .status(200)
            .send({ message: "task deleted successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

export default router;