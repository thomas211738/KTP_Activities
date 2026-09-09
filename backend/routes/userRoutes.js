import express from 'express';

const router = express.Router();

export default function usersRoute(db) {
  // Get all Users
  router.get('/', async (request, response) => {
    try {
      const usersCollection = db.collection('users');
      const q = usersCollection.orderBy('FirstName', 'asc');
      const userSnapshot = await q.get();
      // Archived profiles remain in Firestore but are never returned to the app.
      const userList = userSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(user => Number(user.Position) >= 0);

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
      const userList = userSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(user => Number(user.Position) >= 0);

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

  // Retire the form-based, unauthenticated creator. Account creation now verifies
  // identity and reuses existing profiles through POST /account/session.
  router.post('/', (_request, response) => {
    response.status(410).json({ message: 'Please update the app and sign in with Google to create your account.' });
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
