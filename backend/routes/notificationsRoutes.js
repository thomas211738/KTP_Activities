import express from "express";

const router = express.Router();

export default function notificationRoute(db) {
    // Create a new notification token (upsert — no duplicates)
    router.post("/", async (req, res) => {
        try {
            const { userID, token } = req.body;
            if (!userID || !token) {
                return res.status(400).send({ message: "Please provide both userID and token" });
            }
            const notificationsCollection = db.collection('notifications');

            // Check if this exact token already exists for any user
            const existingTokenSnap = await notificationsCollection.where('token', '==', token).get();

            if (!existingTokenSnap.empty) {
                // Token already registered — update the userID in case it changed, discard any extras
                const first = existingTokenSnap.docs[0];
                // Delete any extras beyond the first
                for (const doc of existingTokenSnap.docs.slice(1)) {
                    await doc.ref.delete();
                }
                // Update userID on the surviving doc if needed
                if (first.data().userID !== userID) {
                    await first.ref.update({ userID });
                }
                return res.status(200).send({ message: "Token already registered", notificationID: first.id });
            }

            // Check if this userID already has a different token — update it
            const existingUserSnap = await notificationsCollection.where('userID', '==', userID).get();
            if (!existingUserSnap.empty) {
                const first = existingUserSnap.docs[0];
                // Delete any extras
                for (const doc of existingUserSnap.docs.slice(1)) {
                    await doc.ref.delete();
                }
                await first.ref.update({ token });
                return res.status(200).send({ message: "Token updated", notificationID: first.id });
            }

            // Brand new — create
            const docRef = await notificationsCollection.add({ userID, token });
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
            const notificationDoc = db.collection('notifications').doc(id);
            const notificationSnapshot = await notificationDoc.get();
            if (notificationSnapshot.exists) {
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
            const notificationsCollection = db.collection('notifications');
            const notificationsSnapshot = await notificationsCollection.get();
            const notificationsList = notificationsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
            const notificationDoc = db.collection('notifications').doc(id);
            const updateData = {};
            if (userID) updateData.userID = userID;
            if (token) updateData.token = token;
            await notificationDoc.update(updateData);
            const updatedNotification = await notificationDoc.get();
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
            const notificationDoc = db.collection('notifications').doc(id);
            await notificationDoc.delete();
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
            const notificationsCollection = db.collection('notifications');
            const q = notificationsCollection.where('userID', '==', userID).limit(1);
            const querySnapshot = await q.get();
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
            const notificationsCollection = db.collection('notifications');
            const q = notificationsCollection.where('token', '==', token).limit(1);
            const querySnapshot = await q.get();
            if (querySnapshot.empty) {
                return res.status(404).send({ message: "No notification found with the provided token" });
            }
            const docToDelete = querySnapshot.docs[0];
            await db.collection('notifications').doc(docToDelete.id).delete();
            res.status(200).send({ message: "Notification deleted successfully", deletedNotification: { id: docToDelete.id, ...docToDelete.data() } });
        } catch (err) {
            console.error("Error deleting notification by token:", err);
            res.status(500).send({ message: "Internal server error" });
        }
    });

    return router;
}