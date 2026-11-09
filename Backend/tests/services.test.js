// tests/services.test.js
'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app     = require('../src/app');
const { cleanTables, closePool } = require('./helpers/testDb');
const { createUser, createService, loginAndGetToken } = require('./helpers/fixtures');

beforeAll(() => cleanTables());
afterAll(() => closePool());
afterEach(() => cleanTables());

describe('GET /api/services', () => {
  it('should list services publicly', async () => {
    await createService({ name: 'Service A' });
    await createService({ name: 'Service B' });

    const res = await request(app).get('/api/services');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});

describe('POST /api/services (Admin)', () => {
  it('should allow admin to create a service', async () => {
    await createUser({ email: 'admin@svc.com', role: 'ADMIN' });
    const token = await loginAndGetToken(request, app, 'admin@svc.com');

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Service', avgServiceDurationMin: 20 });

    expect(res.status).toBe(201);
    expect(res.body.data.service.name).toBe('New Service');
  });

  it('should prevent a USER from creating a service', async () => {
    await createUser({ email: 'user@svc.com', role: 'USER' });
    const token = await loginAndGetToken(request, app, 'user@svc.com');

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hack Service' });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/services/:id/deactivate', () => {
  it('should deactivate a service', async () => {
    await createUser({ email: 'admin@deact.com', role: 'ADMIN' });
    const token = await loginAndGetToken(request, app, 'admin@deact.com');
    const svc   = await createService({ name: 'To Deactivate' });

    const res = await request(app)
      .patch(`/api/services/${svc.id}/deactivate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.service.is_active).toBe(false);
  });
});
