import express from "express";
import { NotificationModel } from "../models/notificationsModel.js";

const router = express.Router();

// Create a new notification
router.post("/", async (req, res) => {
    try {
        const { userID, token } = req.body;

        if (!userID || !token) {
            return res.status(400).send({
                message: "Please provide both userID and token",
            });
        }

        const newNotification = new NotificationModel({ userID, token });
        const savedNotification = await newNotification.save();

        res.status(201).send({
            message: "Notification created successfully",
            notificationID: savedNotification._id,
        });
    } catch (err) {
        console.error("Error creating notification:", err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Get a notification by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await NotificationModel.findById(id);

        if (!notification) {
            return res.status(404).send({ message: "Notification not found" });
        }

        res.status(200).json(notification);
    } catch (err) {
        console.error("Error fetching notification:", err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Get all notifications
router.get("/", async (req, res) => {
    try {
        const notifications = await NotificationModel.find({});
        res.status(200).json({
            count: notifications.length,
            data: notifications,
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Update a notification by ID
router.put("/:id", async (req, res) => {
    try {
        const { userID, token } = req.body;

        if (!userID && !token) {
            return res.status(400).send({
                message: "Please provide at least one field to update (userID or token)",
            });
        }

        const { id } = req.params;
        const updatedNotification = await NotificationModel.findByIdAndUpdate(
            id,
            { userID, token },
            { new: true } // Return the updated document
        );

        if (!updatedNotification) {
            return res.status(404).send({ message: "Notification not found" });
        }

        res.status(200).send({
            message: "Notification updated successfully",
            notification: updatedNotification,
        });
    } catch (err) {
        console.error("Error updating notification:", err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Delete a notification by ID
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNotification = await NotificationModel.findByIdAndDelete(id);

        if (!deletedNotification) {
            return res.status(404).send({ message: "Notification not found" });
        }

        res.status(200).send({ message: "Notification deleted successfully" });
    } catch (err) {
        console.error("Error deleting notification:", err);
        res.status(500).send({ message: "Internal server error" });
    }
});

router.get("/token/:userID", async (req, res) => {
    try {
        const { userID } = req.params;

        if (!userID) {
            return res.status(400).send({
                message: "Please provide a userID",
            });
        }

        const notification = await NotificationModel.findOne({ userID });

        if (!notification) {
            return res.status(200).send({ token: 0 });
        }

        res.status(200).send({
            message: "Token retrieved successfully",
            token: notification.token,
        });
    } catch (err) {
        console.error("Error fetching token by userID:", err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Delete notification by token
router.delete("/token/:token", async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).send({
                message: "Please provide a token",
            });
        }

        const deletedNotification = await NotificationModel.findOneAndDelete({ token });

        if (!deletedNotification) {
            return res.status(404).send({
                message: "No notification found with the provided token",
            });
        }

        res.status(200).send({
            message: "Notification deleted successfully",
            deletedNotification,
        });
    } catch (err) {
        console.error("Error deleting notification by token:", err);
        res.status(500).send({ message: "Internal server error" });
    }
});

export default router;
