import express from "express";

const router = express.Router();

export default function alertsRoute(db) {
    // Get all alerts
    router.get("/", async (request, response) => {
        try {
            const alertsCollection = db.collection('alerts');
            const alertsSnapshot = await alertsCollection.get();
            const alertsList = alertsSnapshot.docs.map(d => {
                const data = d.data();
                // Legacy docs have no Position — default to 0 (visible to all)
                if (data.Position === undefined || data.Position === null) {
                    data.Position = 0;
                } else {
                    data.Position = Number(data.Position);
                }
                return { id: d.id, ...data };
            });
            return response.status(200).json({
                count: alertsList.length,
                data: alertsList,
            });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Get an alert by ID
    router.get("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const alertDoc = db.collection('alerts').doc(id);
            const alertSnapshot = await alertDoc.get();
            if (alertSnapshot.exists) {
                const data = alertSnapshot.data();
                if (data.Position === undefined || data.Position === null) data.Position = 0;
                else data.Position = Number(data.Position);
                return response.status(200).json({ id: alertSnapshot.id, ...data });
            }
            return response.status(404).json({ message: "Alert not found" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Add an alert
    router.post("/", async (request, response) => {
        try {
            const { AlertName, Description, Position } = request.body;
            if (!AlertName || !Description) {
                return response.status(400).send({
                    message: "Send all required fields: AlertName, Description",
                });
            }
            const alertsCollection = db.collection('alerts');
            const newAlert = {
                AlertName,
                Description,
                Position: Position !== undefined ? Number(Position) : 0,
                updatedAt: new Date().toISOString()
            };
            const docRef = await alertsCollection.add(newAlert);
            return response.status(201).send({ id: docRef.id, ...newAlert });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Update an alert
    router.put("/:id", async (request, response) => {
        try {
            const { AlertName, Description, Position } = request.body;
            if (!AlertName || !Description) {
                return response.status(400).send({
                    message: "Send all required fields: AlertName, Description",
                });
            }
            const { id } = request.params;
            const alertDoc = db.collection('alerts').doc(id);
            await alertDoc.update({
                AlertName,
                Description,
                Position: Position !== undefined ? Number(Position) : 0,
                updatedAt: new Date().toISOString()
            });
            return response.status(200).send({ message: "alert updated successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Delete an alert
    router.delete("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const alertDoc = db.collection('alerts').doc(id);
            await alertDoc.delete();
            return response.status(200).send({ message: "alert deleted successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    return router;
}