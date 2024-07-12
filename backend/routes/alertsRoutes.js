import express from "express";

import { Alerts } from "../models/alertsModel.js";

const router = express.Router();

// get all alerts
router.get("/", async (request, response) => {
    try {
        const alertsElements = await Alerts.find({});

        return response.status(200).json({
            count: alertsElements.length,
            data: alertsElements,
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// get an alert by id
router.get("/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const alerts = await Alerts.findById(id);
        return response.status(200).json(alerts);
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// add an alert
router.post("/", async (request, response) => {
    try {
        const {
            AlertName,
            Description
        } = request.body;

        if (
            !request.body.AlertName ||
            !request.body.Description
        ) {
            return response.status(400).send({
                message:
                    "Send all required fields: AlertName, Description",
            });
        }
        const newalert = new Alerts({
            AlertName,
            Description
        });
        await newalert.save();
        return response
            .status(200)
            .send({ message: "alert added successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// update an alert
router.put("/:id", async (request, response) => {
    try {
        if (
            !request.body.AlertName ||
            !request.body.Description
        ) {
            return response.status(400).send({
                message:
                    "Send all required fields: AlertName, Description",
            });
        }
        const { id } = request.params;
        const result = await Alerts.findByIdAndUpdate(id, request.body);
        if (!result) {
            return response.status(404).json({ message: "alert not found" });
        }
        return response
            .status(200)
            .send({ message: "alert updated successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

// delete an alert
router.delete("/:id", async (request, response) => {
    try {
        await Alerts.findByIdAndDelete(request.params.id);
        return response
            .status(200)
            .send({ message: "alert deleted successfully" });
    } catch (error) {
        console.log(error.message);
        response.status(500).send({ message: error.message });
    }
});

export default router;