import express from "express";

const router = express.Router();

// All valid position buckets
const ALL_POSITIONS = [0, 1, 2, 3, 4, 5];

export default function alertsRoute(db) {

    // Get alerts for a given user position (all buckets <= userPosition)
    // Query param: ?position=2  (defaults to 0 if not provided)
    router.get("/", async (request, response) => {
        try {
            const userPos = Number(request.query.position ?? 0);

            // Fetch all buckets the user is eligible for in parallel
            const buckets = ALL_POSITIONS.filter(p => p <= userPos);
            const snapshots = await Promise.all(
                buckets.map(p => db.collection('alerts').doc(String(p)).collection('items').get())
            );

            const alertsList = [];
            snapshots.forEach((snap, i) => {
                const pos = buckets[i];
                snap.docs.forEach(d => {
                    alertsList.push({ id: d.id, Position: pos, ...d.data() });
                });
            });

            // Sort newest first
            alertsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            return response.status(200).json({ count: alertsList.length, data: alertsList });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Get a single alert by position bucket + id: GET /alerts/:position/:id
    router.get("/:position/:id", async (request, response) => {
        try {
            const { position, id } = request.params;
            const doc = await db.collection('alerts').doc(position).collection('items').doc(id).get();
            if (doc.exists) {
                return response.status(200).json({ id: doc.id, Position: Number(position), ...doc.data() });
            }
            return response.status(404).json({ message: "Alert not found" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Add an alert: POST /alerts  body: { AlertName, Description, Position }
    router.post("/", async (request, response) => {
        try {
            const { AlertName, Description, Position } = request.body;
            if (!AlertName || !Description) {
                return response.status(400).send({ message: "AlertName and Description are required." });
            }
            const pos = Position !== undefined ? Number(Position) : 0;
            const newAlert = {
                AlertName,
                Description,
                updatedAt: new Date().toISOString(),
            };
            const docRef = await db.collection('alerts').doc(String(pos)).collection('items').add(newAlert);
            return response.status(201).send({ id: docRef.id, Position: pos, ...newAlert });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Update an alert: PUT /alerts/:position/:id
    router.put("/:position/:id", async (request, response) => {
        try {
            const { AlertName, Description } = request.body;
            if (!AlertName || !Description) {
                return response.status(400).send({ message: "AlertName and Description are required." });
            }
            const { position, id } = request.params;
            const docRef = db.collection('alerts').doc(position).collection('items').doc(id);
            await docRef.update({ AlertName, Description, updatedAt: new Date().toISOString() });
            return response.status(200).send({ message: "alert updated successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Delete an alert: DELETE /alerts/:position/:id
    router.delete("/:position/:id", async (request, response) => {
        try {
            const { position, id } = request.params;
            await db.collection('alerts').doc(position).collection('items').doc(id).delete();
            return response.status(200).send({ message: "alert deleted successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    return router;
}
