import express from 'express';

const router = express.Router();

export default function completedTaskRoute(db) {
    // Get all completed tasks
    router.get("/", async (_, res) => {
        try {
            const completedTasksCollection = db.collection('completed-tasks');
            const completedTasksSnapshot = await completedTasksCollection.get();
            const completedTasksList = completedTasksSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            return res.status(200).json({
                count: completedTasksList.length,
                data: completedTasksList
            });
        } catch (err) {
            console.log(err.message);
            return res.status(500).send({ message: err.message });
        }
    });

    // Get all tasks completed by a specific member
    router.get("/:userId", async (req, res) => {
        try {
            const { userId } = req.params;
            const completedTasksCollection = db.collection('completed-tasks');
            const q = completedTasksCollection.where('CompletedBy', '==', userId);
            const querySnapshot = await q.get();
            const userCompletedTasks = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            return res.status(200).json(userCompletedTasks);
        } catch (err) {
            console.log(err.message);
            return res.status(500).send({ message: err.message });
        }
    });

    // Get all members who completed a certain task
    router.get("/task/:taskId", async (req, res) => {
        try {
            const { taskId } = req.params;
            const completedTasksCollection = db.collection('completed-tasks');
            const q = completedTasksCollection.where('Task', '==', taskId);
            const querySnapshot = await q.get();
            const usersWhoCompletedTask = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            return res.status(200).json(usersWhoCompletedTask);
        } catch (err) {
            console.log(err.message);
            return res.status(500).send({ message: err.message });
        }
    });

    // Create a new completed task
    router.post("/", async (req, res) => {
        try {
            const { CompletedBy, Task } = req.body;
            if (!CompletedBy || !Task) {
                return res.status(400).send("Send valid ObjectIds");
            }
            const completedTasksCollection = db.collection('completed-tasks');
            await completedTasksCollection.add({ CompletedBy, Task });
            return res.status(200).send("Completed Task saved successfully");
        } catch (err) {
            console.log(err.message);
            return res.status(500).send({ message: err.message });
        }
    });

    return router;
}