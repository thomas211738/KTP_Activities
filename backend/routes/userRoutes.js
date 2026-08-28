import express from 'express';

const router = express.Router();

export default function usersRoute(db) {
  // Get all Users
  router.get('/', async (request, response) => {
    try {
      const usersCollection = db.collection('users');
      const q = usersCollection.orderBy('FirstName', 'asc');
      const userSnapshot = await q.get();
      const userList = userSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      return response.status(200).json({
        count: userList.length,
        data: userList,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      response.status(500).send({ message: error.message });
    }
  });

  // Get all Users ordered by Clout
  router.get('/ordered-by-clout', async (request, response) => {
    try {
      const usersCollection = db.collection('users');
      const q = usersCollection.orderBy('Clout', 'desc');
      const userSnapshot = await q.get();
      const userList = userSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      return response.status(200).json({
        count: userList.length,
        data: userList,
      });
    } catch (error) {
      console.error('Error fetching users ordered by Clout:', error);
      response.status(500).send({ message: error.message });
    }
  });

  // Get a User by ID
  router.get('/:id', async (request, response) => {
    try {
      const { id } = request.params;
      const userDoc = db.collection('users').doc(id);
      const userSnapshot = await userDoc.get();
      if (userSnapshot.exists) {
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
      const usersCollection = db.collection('users');
      const q = usersCollection.where('BUEmail', '==', email);
      const querySnapshot = await q.get();
      const userList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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

      const usersCollection = db.collection('users');
      const newUser = {
        BUEmail,
        FirstName,
        LastName,
        GradYear,
        Colleges,
        Major,
        Position,
      };
      await usersCollection.add(newUser);
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
      const userDoc = db.collection('users').doc(id);
      const userSnapshot = await userDoc.get();
      if (!userSnapshot.exists) {
        return response.status(404).json({ message: 'User not found' });
      }
      await userDoc.update(request.body);
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
      const userDoc = db.collection('users').doc(id);
      await userDoc.delete();
      return response.status(200).send({ message: 'User deleted successfully' });
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ message: error.message });
    }
  });

  return router;
}