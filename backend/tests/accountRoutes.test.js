import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import accountRoutes, { resolveAccount, profileFields } from '../routes/accountRoutes.js';

// In-memory Firestore interface. Transactions are serialized; production uses
// Firestore's native conflict/retry handling. No Firebase credentials or writes.
function database(seed = {}) {
  const records = new Map(Object.entries(seed));
  let pending = Promise.resolve();
  const snap = id => ({ id, ref: ref(id), exists: records.has(id), data: () => records.get(id) });
  const ref = id => ({ id, get: async () => snap(id), update: async value => records.set(id, { ...records.get(id), ...value }) });
  const collection = {
    doc: ref,
    where: (field, op, value) => ({ field, value }),
  };
  const tx = {
    get: async target => {
      if (target.id) return snap(target.id);
      return { docs: [...records.keys()].filter(id => !target.field || records.get(id)[target.field] === target.value).map(snap) };
    },
    update: (target, value) => records.set(target.id, { ...records.get(target.id), ...value }),
    create: (target, value) => { assert.equal(records.has(target.id), false); records.set(target.id, value); },
  };
  return { records, collection: () => collection, runTransaction: fn => {
    const job = pending.then(() => fn(tx)); pending = job.catch(() => {}); return job;
  } };
}
const identity = { uid: 'firebase-new', email: 'new@bu.edu', email_verified: true, name: 'New Member' };

test('new member receives a usable profile with position 0 and safe empty fields', async () => {
  const db = database();
  const result = await resolveAccount(db, identity, { create: true });
  assert.equal(result.created, true);
  assert.equal(result.user.Position, 0);
  assert.equal(result.user.FirstName, 'New');
  assert.equal(result.user.LastName, 'Member');
  for (const field of ['Colleges', 'Major', 'Minor', 'Interests']) assert.deepEqual(result.user[field], []);
  assert.ok(result.user.id);
});

test('repeated/concurrent signup requests reuse one profile', async () => {
  const db = database();
  const results = await Promise.all(Array.from({ length: 10 }, () => resolveAccount(db, identity, { create: true })));
  assert.equal(db.records.size, 1);
  assert.equal(results.filter(r => r.created).length, 1);
  assert.equal(new Set(results.map(r => r.user.id)).size, 1);
});

test('existing and archived members retain IDs, position, and saved details', async () => {
  for (const position of [-1, 0, 1, 2, 3, 4, 5]) {
    const db = database({ legacy: { BUEmail: ' NEW@BU.EDU ', Position: position, FirstName: 'Saved', Major: ['CS'] } });
    const result = await resolveAccount(db, identity, { create: true });
    assert.equal(result.created, false); assert.equal(result.user.id, 'legacy');
    assert.equal(result.user.Position, position); assert.equal(result.user.FirstName, 'Saved');
    assert.deepEqual(result.user.Major, ['CS']); assert.equal(db.records.size, 1);
    assert.equal(db.records.get('legacy').BUEmail, identity.email);
  }
});

test('existing non-BU members can sign in; new non-BU accounts cannot register', async () => {
  const outside = { ...identity, email: 'existing@example.com' };
  await assert.rejects(resolveAccount(database(), outside, { create: true }), { status: 403 });
  assert.equal((await resolveAccount(database({ legacy: { BUEmail: outside.email, Position: 2 } }), outside, { create: true })).user.id, 'legacy');
});

test('identity mismatch and ambiguous legacy duplicates are reported, never overwritten', async () => {
  await assert.rejects(resolveAccount(database({ a: { BUEmail: identity.email, AuthUID: 'someone-else' } }), identity, { create: true }), { status: 409 });
  await assert.rejects(resolveAccount(database({ a: { BUEmail: identity.email }, b: { BUEmail: identity.email } }), identity, { create: true }), { status: 409 });
});

test('editing allows optional academics, validates names/year, and forbids identity/role edits', () => {
  const valid = { FirstName: ' New ', LastName: ' Member ', Major: ['CS', 'CS', ''], Minor: [], Colleges: [], GradYear: '' };
  assert.deepEqual(profileFields(valid).Major, ['CS']);
  assert.equal(profileFields(valid).FirstName, 'New');
  assert.equal(profileFields({ ...valid, Class: ' Zeta ' }).Class, 'Zeta');
  assert.equal(profileFields({ ...valid, Class: '' }).Class, '');
  assert.equal(Object.hasOwn(profileFields(valid), 'Class'), false);
  for (const Class of [null, [], 3, 'x'.repeat(101)]) assert.throws(() => profileFields({ ...valid, Class }), { status: 400 });
  for (const key of ['Position', 'BUEmail', 'AuthUID', 'id']) assert.throws(() => profileFields({ ...valid, [key]: 'changed' }), { status: 400 });
  assert.throws(() => profileFields({ ...valid, FirstName: '' }), { status: 400 });
  assert.throws(() => profileFields({ ...valid, GradYear: 'abc' }), { status: 400 });
});

test('HTTP session/profile routes require verified identity, ignore spoofed signup fields and save to the owner', async () => {
  const db = database();
  const app = express(); app.use(express.json());
  app.use('/account', accountRoutes(db, async token => {
    if (token === 'invalid') throw new Error('invalid');
    return { ...identity, email_verified: token !== 'unverified' };
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/account`;
  const request = (path, token, method = 'POST', body = {}) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  try {
    for (const [token, status] of [[undefined, 401], ['invalid', 401], ['unverified', 403]]) assert.equal((await request('/session', token)).status, status);
    assert.equal(db.records.size, 0);
    const created = await request('/session', 'valid', 'POST', { BUEmail: 'spoofed@bu.edu', Position: 5 });
    assert.equal(created.status, 201);
    const { user } = await created.json(); assert.equal(user.BUEmail, identity.email); assert.equal(user.Position, 0);
    assert.equal((await request('/session', 'valid')).status, 200);
    const saved = await request('/profile', 'valid', 'PATCH', { FirstName: 'Edited', LastName: 'Member', Class: ' Zeta ', Major: ['Data Science'], Minor: [], Colleges: ['CDS'], GradYear: '2030' });
    assert.equal(saved.status, 200); assert.equal((await saved.json()).user.id, user.id);
    assert.equal(db.records.get(user.id).FirstName, 'Edited');
    assert.equal(db.records.get(user.id).Class, 'Zeta');
    assert.equal((await request('/session', 'valid').then(response => response.json())).user.Class, 'Zeta');
    assert.equal((await request('/profile', 'valid', 'PATCH', { FirstName: 'Edited', LastName: 'Member', Position: 3 })).status, 400);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
