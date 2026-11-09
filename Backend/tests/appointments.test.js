// tests/appointments.test.js
'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app     = require('../src/app');
const { cleanTables, closePool } = require('./helpers/testDb');
const { createUser, createService, loginAndGetToken } = require('./helpers/fixtures');

beforeAll(() => cleanTables());
afterAll(() => closePool());
afterEach(() => cleanTables());

describe('POST /api/appointments', () => {
  it('should book a walk-in appointment and receive a token', async () => {
    await createUser({ email: 'user@example.com' });
    const token = await loginAndGetToken(request, app, 'user@example.com');
    const service = await createService({ name: 'Eye Clinic' });

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: service.id, type: 'WALK_IN' });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.token.token_number).toBe(1);
    expect(res.body.data.appointment.status).toBe('CONFIRMED');
  });

  it('should book a scheduled appointment', async () => {
    await createUser({ email: 'sched@example.com' });
    const authToken = await loginAndGetToken(request, app, 'sched@example.com');
    const service   = await createService();

    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ serviceId: service.id, type: 'SCHEDULED', scheduledAt });

    expect(res.status).toBe(201);
    expect(res.body.data.appointment.appointment_type).toBe('SCHEDULED');
  });

  it('should prevent double-booking the same time slot', async () => {
    await createUser({ email: 'user1@example.com' });
    await createUser({ email: 'user2@example.com' });
    const token1 = await loginAndGetToken(request, app, 'user1@example.com');
    const token2 = await loginAndGetToken(request, app, 'user2@example.com');
    const service = await createService({ avgServiceDurationMin: 60 });

    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const res1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token1}`)
      .send({ serviceId: service.id, type: 'SCHEDULED', scheduledAt });
    expect(res1.status).toBe(201);

    // Second booking at the same time should conflict
    const res2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token2}`)
      .send({ serviceId: service.id, type: 'SCHEDULED', scheduledAt });
    expect(res2.status).toBe(409);
  });

  it('should return 404 for non-existent service', async () => {
    await createUser({ email: 'noservice@example.com' });
    const token = await loginAndGetToken(request, app, 'noservice@example.com');

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: '00000000-0000-0000-0000-000000000000', type: 'WALK_IN' });

    expect(res.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const service = await createService();
    const res = await request(app)
      .post('/api/appointments')
      .send({ serviceId: service.id, type: 'WALK_IN' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/appointments/:id/cancel', () => {
  it('should cancel a confirmed appointment', async () => {
    await createUser({ email: 'cancel@example.com' });
    const authToken = await loginAndGetToken(request, app, 'cancel@example.com');
    const service   = await createService();

    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ serviceId: service.id, type: 'WALK_IN' });

    const apptId = bookRes.body.data.appointment.id;

    const cancelRes = await request(app)
      .patch(`/api/appointments/${apptId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.appointment.status).toBe('CANCELLED');
  });

  it('should not allow another user to cancel someone else\'s appointment', async () => {
    await createUser({ email: 'owner@example.com' });
    await createUser({ email: 'other@example.com' });
    const ownerToken = await loginAndGetToken(request, app, 'owner@example.com');
    const otherToken = await loginAndGetToken(request, app, 'other@example.com');
    const service = await createService();

    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ serviceId: service.id, type: 'WALK_IN' });

    const apptId = bookRes.body.data.appointment.id;

    const res = await request(app)
      .patch(`/api/appointments/${apptId}/cancel`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/appointments/my', () => {
  it('should return only the current user\'s appointments', async () => {
    await createUser({ email: 'myappt@example.com' });
    const token   = await loginAndGetToken(request, app, 'myappt@example.com');
    const service = await createService();

    await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: service.id, type: 'WALK_IN' });

    const res = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
