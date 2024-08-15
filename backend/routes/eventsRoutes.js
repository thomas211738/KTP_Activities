import express from "express";

import { Events } from "../models/eventsModel.js";

const router = express.Router();

// get all Events
router.get("/", async (request, response) => {
    try {
        const eventElements = await Events.find({});

        return response.status(200).json({
            count: eventElements.length,
            data: eventElements,
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// get a event by id
router.get("/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const event = await Events.findById(id);
        return response.status(200).json(event);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// add a event
router.post("/", async (request, response) => {
    try {
        const {
            Name,
            Day,
            Time,
            Location,
            Description,
            Position
        } = request.body;

        if (
            !request.body.Name ||
            !request.body.Day ||
            !request.body.Time ||
            !request.body.Location ||
            !request.body.Description ||
            !request.body.Position
        ) {
            return response.status(400).send({
                message:
                    "Send all required fields: Name, Day, Time, Location, Position, Description",
            });
        }
        const newevent = new Events({
            Name,
            Day,
            Time,
            Location,
            Description,
            Position
        });
        await newevent.save();
        return response
            .status(200)
            .send({ message: "event added successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// update a event
router.put("/:id", async (request, response) => {
    try {
        if (
            !request.body.Name ||
            !request.body.Day ||
            !request.body.Time ||
            !request.body.Location ||
            !request.body.Description || 
            !request.body.Position
        ) {
            return response.status(400).send({
                message:
                    "Send all required fields: Name, Day, Time, Location, Position, Description",
            });
        }
        const { id } = request.params;
        const result = await Events.findByIdAndUpdate(id, request.body);
        if (!result) {
            return response.status(404).json({ message: "event not found" });
        }
        return response
            .status(200)
            .send({ message: "event updated successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// delete an event
router.delete("/:id", async (request, response) => {
    try {
        await Events.findByIdAndDelete(request.params.id);
        return response
            .status(200)
            .send({ message: "event deleted successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

export default router;