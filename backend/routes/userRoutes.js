import express from 'express';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

const router = express.Router();

export default function usersRoute(db) {
  // Get all Users
  router.get('/', async (request, response) => {
    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, orderBy('FirstName', 'asc')); // Sort and limit to 10
      const userSnapshot = await getDocs(q);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      return response.status(200).json({
        count: userList.length,
        data: userList,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      response.status(500).send({ message: error.message });
    }
  });

  // Get a User by ID
  router.get('/:id', async (request, response) => {
    try {
      const { id } = request.params;
      const userDoc = doc(db, 'users', id);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        return response.status(200).json({ id: userSnapshot.id, ...userSnapshot.data() });
      } else {
        return response.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ message: error.message });
    }
  });

  // Get a User by email
  router.get('/email/:email', async (request, response) => {
    try {
      const { email } = request.params;
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('BUEmail', '==', email));
      const querySnapshot = await getDocs(q);
      const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return response.status(200).json(userList);
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ message: error.message });
    }
  });

  // Add a User
  router.post('/', async (request, response) => {
    try {
      const {
        BUEmail,
        FirstName,
        LastName,
        GradYear,
        Colleges,
        Major,
        Position,
      } = request.body;

      if (!BUEmail || !FirstName || !LastName || !GradYear || !Colleges || !Major || !Position) {
        return response.status(400).send({
          message: 'Send all required fields: BUEmail, FirstName, LastName, GradYear, Colleges, Major, Position',
        });
      } else if (Position > 4 || Position < 0) {
        return response.status(401).send({
          message: 'Position must be an integer 0 through 4',
        });
      }

      const usersCollection = collection(db, 'users');
      const newUser = {
        BUEmail,
        FirstName,
        LastName,
        GradYear,
        Colleges,
        Major,
        Position,
        // Add other optional fields from your original schema if provided
      };
      await addDoc(usersCollection, newUser);
      return response.status(200).send({ message: 'User added successfully' });
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ message: error.message });
    }
  });

  // Update a User
  router.put('/:id', async (request, response) => {
    try {
      const { id } = request.params;
      const userDoc = doc(db, 'users', id);
      const userSnapshot = await getDoc(userDoc);
      if (!userSnapshot.exists()) {
        return response.status(404).json({ message: 'User not found' });
      }
      await updateDoc(userDoc, request.body);
      return response.status(200).send({ message: 'User updated successfully' });
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ message: error.message });
    }
  });

  // Delete a User
  router.delete('/:id', async (request, response) => {
    try {
      const { id } = request.params;
      const userDoc = doc(db, 'users', id);
      await deleteDoc(userDoc);
      return response.status(200).send({ message: 'User deleted successfully' });
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ message: error.message });
    }
  });

  return router;
}