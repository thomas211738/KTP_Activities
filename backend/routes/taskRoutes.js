import express from "express";

const router = express.Router();

export default function taskRoute(db) {
    // Get all tasks
    router.get("/", async (request, response) => {
        try {
            const tasksCollection = db.collection('tasks');
            const tasksSnapshot = await tasksCollection.get();
            const tasksList = tasksSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            return response.status(200).json({
                count: tasksList.length,
                data: tasksList,
            });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Get a task by ID
    router.get("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const taskDoc = db.collection('tasks').doc(id);
            const taskSnapshot = await taskDoc.get();
            if (taskSnapshot.exists) {
                return response.status(200).json({ id: taskSnapshot.id, ...taskSnapshot.data() });
            }
            return response.status(404).json({ message: 'Task not found' });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Add a task
    router.post("/", async (request, response) => {
        try {
            const { TaskName, Completed, Mandatory, ParticipantsNeeded, Description, PointsWorth } = request.body;
            if (!TaskName || Completed === undefined || Mandatory === undefined || !ParticipantsNeeded || !Description) {
                return response.status(400).send({
                    message: "Send all required fields: TaskName, Completed, Mandatory, ParticipantsNeeded, Description, PointsWorth",
                });
            }
            const tasksCollection = db.collection('tasks');
            const newTask = { TaskName, Completed, Mandatory, ParticipantsNeeded, Description, PointsWorth };
            await tasksCollection.add(newTask);
            return response.status(200).send({ message: "task added successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Update a task
    router.put("/:id", async (request, response) => {
        try {
            const { TaskName, Completed, Mandatory, ParticipantsNeeded, Description, PointsWorth } = request.body;
            if (!TaskName || Completed === undefined || Mandatory === undefined || !ParticipantsNeeded || !Description || PointsWorth === undefined) {
                return response.status(400).send({
                    message: "Send all required fields: TaskName, Completed, Mandatory, ParticipantsNeeded, Description, PointsWorth",
                });
            }
            const { id } = request.params;
            const taskDoc = db.collection('tasks').doc(id);
            await taskDoc.update({ TaskName, Completed, Mandatory, ParticipantsNeeded, Description, PointsWorth });
            return response.status(200).send({ message: "task updated successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Delete a task
    router.delete("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const taskDoc = db.collection('tasks').doc(id);
            await taskDoc.delete();
            return response.status(200).send({ message: "task deleted successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    return router;
}