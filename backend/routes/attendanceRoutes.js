import express from 'express';
import { randomBytes } from 'crypto';
import admin from 'firebase-admin';

const router = express.Router();
const SESSION_DOC_ID = 'current';

function attendanceSessions(eventId, db) {
  return db.collection('events').doc(eventId).collection('attendanceSession');
}

function attendeeRecords(eventId, db) {
  return db.collection('events').doc(eventId).collection('attendees');
}

function attendancePayload(eventId, sessionToken) {
  return JSON.stringify({ v: 1, eventId, sessionToken });
}

function parseAttendancePayload(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed?.v !== 1 || typeof parsed.eventId !== 'string' || typeof parsed.sessionToken !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function attendanceRoute(db) {
  // Resolve the Firebase identity to the authoritative KTP user record. No
  // attendance action trusts a user ID or Position supplied by the phone.
  const requireKtpUser = async (req, res, next) => {
    const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
    if (!match) return res.status(401).json({ message: 'Sign in is required.' });
    try {
      const decoded = await admin.auth().verifyIdToken(match[1]);
      const email = String(decoded.email || '').toLowerCase();
      if (!email) return res.status(403).json({ message: 'A verified email is required.' });
      const userSnap = await db.collection('users').where('BUEmail', '==', email).limit(1).get();
      if (userSnap.empty) return res.status(403).json({ message: 'No KTP member record matches this account.' });
      const doc = userSnap.docs[0];
      req.ktpUser = { id: doc.id, ...doc.data(), Position: Number(doc.data().Position ?? 0) };
      return next();
    } catch (error) {
      console.warn('[attendance] identity verification failed:', error.message);
      return res.status(401).json({ message: 'Your sign-in session is invalid. Please sign in again.' });
    }
  };

  const requireEboard = (req, res, next) => {
    if (req.ktpUser.Position !== 3) return res.status(403).json({ message: 'Only position 3 Eboard members can manage attendance.' });
    return next();
  };

  // Creates the sole active attendance session for an event. Concurrent Eboard
  // starts return the same active session; a session ended earlier starts with
  // a fresh QR token, invalidating the prior one.
  router.post('/events/:eventId/attendance-sessions', requireKtpUser, requireEboard, async (req, res) => {
    const { eventId } = req.params;
    const eventRef = db.collection('events').doc(eventId);
    const sessionRef = attendanceSessions(eventId, db).doc(SESSION_DOC_ID);
    try {
      const result = await db.runTransaction(async transaction => {
        const [eventSnap, sessionSnap] = await Promise.all([transaction.get(eventRef), transaction.get(sessionRef)]);
        if (!eventSnap.exists) throw Object.assign(new Error('Event not found.'), { status: 404 });
        if (sessionSnap.exists) {
          const currentSession = sessionSnap.data();
          if (currentSession.status === 'active') return { session: currentSession, created: false };
          const session = {
            status: 'active',
            sessionToken: randomBytes(32).toString('base64url'),
            startedByUserId: req.ktpUser.id,
          };
          transaction.update(sessionRef, session);
          return { session, created: true };
        }
        const session = {
          status: 'active',
          sessionToken: randomBytes(32).toString('base64url'),
          startedByUserId: req.ktpUser.id,
        };
        transaction.create(sessionRef, session);
        return { session, created: true };
      });
      return res.status(result.created ? 201 : 200).json({
        created: result.created,
        session: { status: 'active', payload: attendancePayload(eventId, result.session.sessionToken) },
      });
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message || 'Unable to start attendance.' });
    }
  });

  // Lets any position-3 Eboard member reopen the one active QR code.
  router.get('/events/:eventId/attendance-sessions/current', requireKtpUser, requireEboard, async (req, res) => {
    try {
      const snap = await attendanceSessions(req.params.eventId, db).doc(SESSION_DOC_ID).get();
      if (!snap.exists) return res.status(200).json({ session: null });
      const session = snap.data();
      return res.status(200).json({
        session: session.status === 'active'
          ? { status: 'active', payload: attendancePayload(req.params.eventId, session.sessionToken) }
          : { status: 'ended' },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message || 'Unable to load attendance.' });
    }
  });

  router.post('/events/:eventId/attendance-sessions/end', requireKtpUser, requireEboard, async (req, res) => {
    const sessionRef = attendanceSessions(req.params.eventId, db).doc(SESSION_DOC_ID);
    try {
      await db.runTransaction(async transaction => {
        const snap = await transaction.get(sessionRef);
        if (!snap.exists) throw Object.assign(new Error('No attendance session exists for this event.'), { status: 404 });
        if (snap.data().status !== 'active') throw Object.assign(new Error('Attendance is already ended.'), { status: 409 });
        transaction.update(sessionRef, { status: 'ended', endedByUserId: req.ktpUser.id });
      });
      return res.status(200).json({ message: 'Attendance ended.' });
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message || 'Unable to end attendance.' });
    }
  });

  router.post('/attendance/check-in', requireKtpUser, async (req, res) => {
    const payload = parseAttendancePayload(req.body?.payload);
    if (!payload) return res.status(400).json({ message: 'This is not a valid KTP attendance QR code.' });
    const eventRef = db.collection('events').doc(payload.eventId);
    const sessionRef = attendanceSessions(payload.eventId, db).doc(SESSION_DOC_ID);
    const attendeeRef = attendeeRecords(payload.eventId, db).doc(req.ktpUser.id);
    try {
      await db.runTransaction(async transaction => {
        const [eventSnap, sessionSnap, attendeeSnap] = await Promise.all([
          transaction.get(eventRef), transaction.get(sessionRef), transaction.get(attendeeRef),
        ]);
        if (!eventSnap.exists) throw Object.assign(new Error('This event no longer exists.'), { status: 404 });
        const session = sessionSnap.data();
        if (!sessionSnap.exists || session.status !== 'active' || session.sessionToken !== payload.sessionToken) {
          throw Object.assign(new Error('This attendance session is inactive or invalid.'), { status: 400 });
        }
        const eventPosition = Number(eventSnap.data().Position ?? 3);
        if (req.ktpUser.Position < eventPosition) throw Object.assign(new Error('You are not eligible for this event.'), { status: 403 });
        if (attendeeSnap.exists) throw Object.assign(new Error('You are already checked in.'), { status: 409 });
        transaction.create(attendeeRef, {
          userId: req.ktpUser.id,
          email: req.ktpUser.BUEmail || '',
          firstName: req.ktpUser.FirstName || '',
          lastName: req.ktpUser.LastName || '',
          status: 'present',
        });
      });
      return res.status(201).json({ message: 'Attendance recorded.' });
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message || 'Unable to record attendance.' });
    }
  });

  router.get('/events/:eventId/attendees', requireKtpUser, requireEboard, async (req, res) => {
    try {
      const eventSnap = await db.collection('events').doc(req.params.eventId).get();
      if (!eventSnap.exists) return res.status(404).json({ message: 'Event not found.' });
      const eventPosition = Number(eventSnap.data().Position ?? 3);
      const [usersSnap, attendeesSnap] = await Promise.all([
        db.collection('users').get(), attendeeRecords(req.params.eventId, db).get(),
      ]);
      const present = attendeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const presentIds = new Set(present.map(person => person.userId));
      const notCheckedIn = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data(), Position: Number(doc.data().Position ?? 0) }))
        .filter(user => user.Position >= eventPosition && !presentIds.has(user.id))
        .map(user => ({ userId: user.id, email: user.BUEmail || '', firstName: user.FirstName || '', lastName: user.LastName || '' }));
      return res.status(200).json({ present, notCheckedIn });
    } catch (error) {
      return res.status(500).json({ message: error.message || 'Unable to load attendance.' });
    }
  });

  return router;
}
