import express from 'express';
import admin from 'firebase-admin';
import { createHash } from 'node:crypto';

const fail = (status, message) => Object.assign(new Error(message), { status });
const normalizeEmail = value => String(value || '').trim().toLowerCase();

// Reuse historical IDs so photos, notifications and attendance keep their links.
// New records use a deterministic email key, preventing concurrent duplicates.
export async function resolveAccount(db, identity, { create = false } = {}) {
  const email = normalizeEmail(identity.email);
  const ref = db.collection('users').doc(`member_${createHash('sha256').update(email).digest('hex')}`);
  return db.runTransaction(async tx => {
    const canonical = await tx.get(ref);
    let matches;
    if (canonical.exists) {
      matches = [canonical];
    } else {
      const exact = await tx.get(db.collection('users').where('BUEmail', '==', email));
      matches = exact.docs;
      if (!matches.length) {
        // Compatibility with old mixed-case emails. Only used before linking;
        // normalize the matched email below so later logins use the indexed query.
        const legacy = await tx.get(db.collection('users'));
        matches = legacy.docs.filter(doc => normalizeEmail(doc.data().BUEmail) === email);
      }
    }
    if (matches.length > 1) throw fail(409, 'Multiple profiles match your email. Please contact Eboard to resolve your account.');
    if (matches.length) {
      const doc = matches[0];
      const user = doc.data();
      if (user.AuthUID && user.AuthUID !== identity.uid) throw fail(409, 'This profile is linked to another sign-in. Please contact Eboard.');
      if (user.AuthUID !== identity.uid || user.BUEmail !== email) {
        tx.update(doc.ref, { AuthUID: identity.uid, BUEmail: email });
      }
      return { created: false, user: { ...user, id: doc.id, AuthUID: identity.uid, BUEmail: email } };
    }
    if (!create) throw fail(404, 'Your profile was not found. Please sign in again.');
    if (!email.endsWith('@bu.edu')) throw fail(403, 'Please use your BU email to create an account.');
    const names = String(identity.name || '').trim().split(/\s+/).filter(Boolean);
    const user = {
      AuthUID: identity.uid, BUEmail: email, Position: 0,
      FirstName: names.shift() || '', LastName: names.join(' '),
      GradYear: '', Colleges: [], Major: [], Minor: [], Interests: [], Clout: 0,
    };
    tx.create(ref, user);
    return { created: true, user: { ...user, id: ref.id } };
  });
}

export function profileFields(body) {
  const allowed = ['FirstName', 'LastName', 'Class', 'GradYear', 'Colleges', 'Major', 'Minor'];
  if (!body || Object.keys(body).some(key => !allowed.includes(key))) throw fail(400, 'Only profile details can be edited here.');
  const result = {};
  for (const key of allowed) {
    if (!Object.hasOwn(body, key)) continue;
    if (['Colleges', 'Major', 'Minor'].includes(key)) {
      if (!Array.isArray(body[key]) || body[key].length > 12 || body[key].some(value => typeof value !== 'string' || value.trim().length > 120)) throw fail(400, `Please check ${key.toLowerCase()}.`);
      result[key] = [...new Set(body[key].map(value => value.trim()).filter(Boolean))];
    } else {
      if (typeof body[key] !== 'string' || body[key].trim().length > 100) throw fail(400, `Please check ${key}.`);
      result[key] = body[key].trim();
    }
  }
  if (!result.FirstName || !result.LastName) throw fail(400, 'Please enter your first and last name.');
  if (result.GradYear && !/^(19|20|21)\d{2}$/.test(result.GradYear)) throw fail(400, 'Enter a four-digit graduation year, or leave it blank.');
  return result;
}

export default function accountRoutes(db, verifyToken = token => admin.auth().verifyIdToken(token, true)) {
  const router = express.Router();
  router.use(async (req, res, next) => {
    const token = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '')?.[1];
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    try {
      req.identity = await verifyToken(token);
      if (!req.identity.uid || !req.identity.email || req.identity.email_verified !== true) return res.status(403).json({ message: 'Sign in with a verified Google email.' });
      next();
    } catch {
      res.status(401).json({ message: 'Your sign-in expired. Please sign in again.' });
    }
  });
  router.post('/session', async (req, res) => {
    try {
      const result = await resolveAccount(db, req.identity, { create: true });
      res.status(result.created ? 201 : 200).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to load your account. Please try again.' });
    }
  });
  router.patch('/profile', async (req, res) => {
    try {
      const fields = profileFields(req.body);
      const { user } = await resolveAccount(db, req.identity);
      const ref = db.collection('users').doc(user.id);
      await ref.update(fields);
      const updated = await ref.get();
      res.json({ user: { ...updated.data(), id: updated.id } });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to save your profile. Please try again.' });
    }
  });
  return router;
}
