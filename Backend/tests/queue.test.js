// tests/queue.test.js
'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app     = require('../src/app');
const { pool, cleanTables, closePool } = require('./helpers/testDb');
const { createUser, createService, loginAndGetToken } = require('./helpers/fixtures');

beforeAll(() => cleanTables());
afterAll(() => closePool());
afterEach(() => cleanTables());

const bookWalkIn = async (userToken, serviceId) =>
  request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ serviceId, type: 'WALK_IN' });

const assignStaff = async (adminToken, staffId, serviceId) => {
  await request(app)
    .post('/api/staff/assign')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ staffId, serviceId });
};

describe('Queue operations', () => {
  let userToken, staffToken, adminToken;
  let service, staffUser;

  beforeEach(async () => {
    const user  = await createUser({ email: 'user@q.com', role: 'USER' });
    staffUser   = await createUser({ email: 'staff@q.com', role: 'STAFF' });
    const admin = await createUser({ email: 'admin@q.com', role: 'ADMIN' });
    service     = await createService({ name: 'Queue Service' });

    userToken  = await loginAndGetToken(request, app, 'user@q.com');
    staffToken = await loginAndGetToken(request, app, 'staff@q.com');
    adminToken = await loginAndGetToken(request, app, 'admin@q.com');

    // Assign staff to service
    await assignStaff(adminToken, staffUser.id, service.id);
  });

  it('should get the queue for a service', async () => {
    await bookWalkIn(userToken, service.id);

    const res = await request(app)
      .get(`/api/queue/${service.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tokens).toHaveLength(1);
    expect(res.body.data.stats.waiting).toBe('1');
  });

  it('should allow assigned staff to call the next token', async () => {
    await bookWalkIn(userToken, service.id);

    const res = await request(app)
      .post(`/api/queue/${service.id}/call-next`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.token.status).toBe('CALLED');
  });

  it('should not allow unassigned staff to call next token', async () => {
    const unassignedStaff = await createUser({ email: 'nostaff@q.com', role: 'STAFF' });
    const unassignedToken = await loginAndGetToken(request, app, 'nostaff@q.com');
    await bookWalkIn(userToken, service.id);

    const res = await request(app)
      .post(`/api/queue/${service.id}/call-next`)
      .set('Authorization', `Bearer ${unassignedToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 when no waiting tokens exist', async () => {
    const res = await request(app)
      .post(`/api/queue/${service.id}/call-next`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(404);
  });

  it('should complete a called token and update appointment status', async () => {
    await bookWalkIn(userToken, service.id);

    const callRes = await request(app)
      .post(`/api/queue/${service.id}/call-next`)
      .set('Authorization', `Bearer ${staffToken}`);

    const tokenId = callRes.body.data.token.id;

    const completeRes = await request(app)
      .patch(`/api/queue/tokens/${tokenId}/complete`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.token.status).toBe('COMPLETED');
  });

  it('should skip a called token', async () => {
    await bookWalkIn(userToken, service.id);

    const callRes = await request(app)
      .post(`/api/queue/${service.id}/call-next`)
      .set('Authorization', `Bearer ${staffToken}`);

    const tokenId = callRes.body.data.token.id;

    const skipRes = await request(app)
      .patch(`/api/queue/tokens/${tokenId}/skip`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(skipRes.status).toBe(200);
    expect(skipRes.body.data.token.status).toBe('SKIPPED');
  });

  it('should issue sequential token numbers', async () => {
    const user2 = await createUser({ email: 'user2@q.com' });
    const token2 = await loginAndGetToken(request, app, 'user2@q.com');

    const r1 = await bookWalkIn(userToken, service.id);
    const r2 = await bookWalkIn(token2, service.id);

    expect(r1.body.data.token.token_number).toBe(1);
    expect(r2.body.data.token.token_number).toBe(2);
  });
});
