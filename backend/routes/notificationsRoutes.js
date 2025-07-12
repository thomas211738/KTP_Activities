import express from "express";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, limit } from "firebase/firestore";

const router = express.Router();

export default function notificationRoute(db) {
    // Create a new notification
    router.post("/", async (req, res) => {
        try {
            const { userID, token } = req.body;
            if (!userID || !token) {
                return res.status(400).send({ message: "Please provide both userID and token" });
            }
            const notificationsCollection = collection(db, 'notifications');
            const newNotification = { userID, token };
            const docRef = await addDoc(notificationsCollection, newNotification);
            res.status(201).send({ message: "Notification created successfully", notificationID: docRef.id });
        } catch (err) {
            console.error("Error creating notification:", err);
            res.status(500).send({ message: "Internal server error" });
        }
    });

    // Get a notification by ID
    router.get("/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const notificationDoc = doc(db, 'notifications', id);
            const notificationSnapshot = await getDoc(notificationDoc);
            if (notificationSnapshot.exists()) {
                return res.status(200).json({ id: notificationSnapshot.id, ...notificationSnapshot.data() });
            }
            return res.status(404).send({ message: "Notification not found" });
        } catch (err) {
            console.error("Error fetching notification:", err);
            res.status(500).send({ message: "Internal server error" });
        }
    });

    // Get all notifications
    router.get("/", async (req, res) => {
        try {
            const notificationsCollection = collection(db, 'notifications');
            const notificationsSnapshot = await getDocs(notificationsCollection);
            const notificationsList = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.status(200).json({ count: notificationsList.length, data: notificationsList });
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
                return res.status(400).send({ message: "Please provide at least one field to update (userID or token)" });
            }
            const { id } = req.params;
            const notificationDoc = doc(db, 'notifications', id);
            const updateData = {};
            if (userID) updateData.userID = userID;
            if (token) updateData.token = token;
            await updateDoc(notificationDoc, updateData);
            const updatedNotification = await getDoc(notificationDoc);
            res.status(200).send({ message: "Notification updated successfully", notification: { id: updatedNotification.id, ...updatedNotification.data() } });
        } catch (err) {
            console.error("Error updating notification:", err);
            res.status(500).send({ message: "Internal server error" });
        }
    });

    // Delete a notification by ID
    router.delete("/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const notificationDoc = doc(db, 'notifications', id);
            await deleteDoc(notificationDoc);
            res.status(200).send({ message: "Notification deleted successfully" });
        } catch (err) {
            console.error("Error deleting notification:", err);
            res.status(500).send({ message: "Internal server error" });
        }
    });

    // Get token by userID
    router.get("/token/:userID", async (req, res) => {
        try {
            const { userID } = req.params;
            if (!userID) {
                return res.status(400).send({ message: "Please provide a userID" });
            }
            const notificationsCollection = collection(db, 'notifications');
            const q = query(notificationsCollection, where('userID', '==', userID), limit(1));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return res.status(200).send({ token: 0 });
            }
            const notification = querySnapshot.docs[0].data();
            res.status(200).send({ message: "Token retrieved successfully", token: notification.token });
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
                return res.status(400).send({ message: "Please provide a token" });
            }
            const notificationsCollection = collection(db, 'notifications');
            const q = query(notificationsCollection, where('token', '==', token), limit(1));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return res.status(404).send({ message: "No notification found with the provided token" });
            }
            const docToDelete = querySnapshot.docs[0];
            await deleteDoc(doc(db, 'notifications', docToDelete.id));
            res.status(200).send({ message: "Notification deleted successfully", deletedNotification: { id: docToDelete.id, ...docToDelete.data() } });
        } catch (err) {
            console.error("Error deleting notification by token:", err);
            res.status(500).send({ message: "Internal server error" });
        }
    });

    return router;
}