// tests/auth.test.js
'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app     = require('../src/app');
const { cleanTables, closePool } = require('./helpers/testDb');
const { createUser, loginAndGetToken } = require('./helpers/fixtures');

beforeAll(() => cleanTables());
afterAll(() => closePool());
afterEach(() => cleanTables());

describe('POST /api/auth/register', () => {
  it('should register a new user and return a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name:     'Alice Smith',
      email:    'alice@example.com',
      password: 'Secret1234',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('should return 400 for weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name:     'Bob',
      email:    'bob@example.com',
      password: 'weak',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 409 for duplicate email', async () => {
    await createUser({ email: 'dup@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      name:     'Dup',
      email:    'dup@example.com',
      password: 'Secret1234',
    });
    expect(res.status).toBe(409);
  });

  it('should return 400 for missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name:     'No Email',
      password: 'Secret1234',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    await createUser({ email: 'login@example.com' });
    const res = await request(app).post('/api/auth/login').send({
      email:    'login@example.com',
      password: 'Secret1234',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('should return 401 for wrong password', async () => {
    await createUser({ email: 'user@example.com' });
    const res = await request(app).post('/api/auth/login').send({
      email:    'user@example.com',
      password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    'ghost@example.com',
      password: 'Secret1234',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user profile with valid token', async () => {
    await createUser({ email: 'me@example.com' });
    const token = await loginAndGetToken(request, app, 'me@example.com');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@example.com');
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

describe('Role-based authorization', () => {
  it('should block USER from admin endpoint', async () => {
    await createUser({ email: 'user@example.com', role: 'USER' });
    const token = await loginAndGetToken(request, app, 'user@example.com');

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('should allow ADMIN to access admin dashboard', async () => {
    await createUser({ email: 'admin@example.com', role: 'ADMIN' });
    const token = await loginAndGetToken(request, app, 'admin@example.com');

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
