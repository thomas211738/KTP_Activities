import express from 'express';
import { collection, getDocs, query, where } from 'firebase/firestore';

const router = express.Router();

export default function completedTaskRoute(db) {
    // Get all completed tasks
    router.get("/", async (_, res) => {
        try {
            const completedTasksCollection = collection(db, 'completed-tasks');
            const completedTasksSnapshot = await getDocs(completedTasksCollection);
            const completedTasksList = completedTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            const completedTasksCollection = collection(db, 'completed-tasks');
            const q = query(completedTasksCollection, where('CompletedBy', '==', userId));
            const querySnapshot = await getDocs(q);
            const userCompletedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            const completedTasksCollection = collection(db, 'completed-tasks');
            const q = query(completedTasksCollection, where('Task', '==', taskId));
            const querySnapshot = await getDocs(q);
            const usersWhoCompletedTask = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            const completedTasksCollection = collection(db, 'completed-tasks');
            addDoc(completedTasksCollection, { CompletedBy, Task });
        await addDoc(completedTasksCollection, newCompletedTask);
            return res.status(200).send("Completed Task saved successfully");
        } catch (err) {
            console.log(err.message);
            return res.status(500).send({ message: err.message });
        }
    });

    return router;
}