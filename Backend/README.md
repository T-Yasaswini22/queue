# QueueLess Backend

**Digital Appointment Management System** — RESTful API built with Node.js, Express, and PostgreSQL.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [NPM Scripts](#npm-scripts)
- [API Overview](#api-overview)
- [Sample Requests](#sample-requests)
- [Testing](#testing)
- [Notifications](#notifications)
- [Security](#security)

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Runtime       | Node.js ≥ 18                      |
| Framework     | Express.js 4                      |
| Database      | PostgreSQL 14+ via `pg`           |
| Auth          | JWT (`jsonwebtoken`) + bcryptjs   |
| Validation    | express-validator                 |
| Docs          | Swagger (swagger-jsdoc + swagger-ui-express) |
| Testing       | Jest + Supertest                  |
| Logging       | Winston + Morgan                  |
| Security      | Helmet, CORS, express-rate-limit  |
| Notifications | Nodemailer (SMTP)                 |

---

## Project Structure

```
backend/
├── src/
│   ├── app.js                  # Express app configuration
│   ├── server.js               # HTTP server entry point
│   ├── config/
│   │   ├── env.js              # Environment variable loader
│   │   ├── database.js         # PostgreSQL pool + helpers
│   │   ├── migrate.js          # Database schema migration
│   │   ├── seed.js             # Sample data seeder
│   │   └── swagger.js          # OpenAPI spec configuration
│   ├── controllers/            # HTTP request handlers
│   ├── services/               # Business logic layer
│   ├── repositories/           # Database access layer
│   ├── routes/                 # Express route definitions
│   ├── middleware/
│   │   ├── authenticate.js     # JWT verification
│   │   ├── authorize.js        # Role-based access control
│   │   ├── validate.js         # Validation result checker
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── rateLimiter.js      # Rate limiting
│   │   └── validators/         # express-validator rule sets
│   └── utils/
│       ├── ApiError.js         # Custom error class
│       ├── ApiResponse.js      # Response envelope helper
│       ├── asyncHandler.js     # Async route wrapper
│       ├── jwt.js              # Token sign/verify
│       ├── logger.js           # Winston logger
│       └── pagination.js       # Pagination helpers
└── tests/
    ├── helpers/
    │   ├── testDb.js           # Test database utilities
    │   └── fixtures.js         # Test data factories
    ├── auth.test.js
    ├── appointments.test.js
    ├── queue.test.js
    └── services.test.js
```

---

## Quick Start

### 1. Clone and install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```

### 3. Create and migrate the database

```bash
# Create the database (run in psql or pgAdmin):
# CREATE DATABASE queueless;

npm run migrate
```

### 4. Seed sample data (optional)

```bash
npm run seed
```

### 5. Start the development server

```bash
npm run dev
```

The API is now available at **http://localhost:5000**  
Swagger docs: **http://localhost:5000/api-docs**

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable                   | Description                              | Default              |
|----------------------------|------------------------------------------|----------------------|
| `NODE_ENV`                 | `development` / `production` / `test`    | `development`        |
| `PORT`                     | HTTP server port                         | `5000`               |
| `DB_HOST`                  | PostgreSQL host                          | `localhost`          |
| `DB_PORT`                  | PostgreSQL port                          | `5432`               |
| `DB_NAME`                  | Database name                            | `queueless`          |
| `DB_USER`                  | Database user                            | `postgres`           |
| `DB_PASSWORD`              | Database password                        | _(empty)_            |
| `TEST_DB_NAME`             | Test database name                       | `queueless_test`     |
| `JWT_SECRET`               | JWT signing secret (keep secret!)        | _(required)_         |
| `JWT_EXPIRES_IN`           | Token expiry                             | `7d`                 |
| `BCRYPT_ROUNDS`            | bcrypt work factor                       | `12`                 |
| `CORS_ORIGIN`              | Allowed CORS origin                      | `http://localhost:4200` |
| `NOTIFICATIONS_ENABLED`    | Enable email notifications               | `false`              |
| `EMAIL_PROVIDER`           | `smtp` or `dev`                          | `dev`                |
| `SMTP_HOST`                | SMTP server hostname                     |                      |
| `SMTP_USER`                | SMTP login username                      |                      |
| `SMTP_PASS`                | SMTP password / app password             |                      |

---

## Database Setup

### Prerequisites

- PostgreSQL 14 or higher

### Steps

```sql
-- 1. Create databases
CREATE DATABASE queueless;
CREATE DATABASE queueless_test;   -- for tests only
```

```bash
# 2. Run migrations (creates all tables, types, indexes, triggers)
npm run migrate

# 3. Run migrations on the test database
npm run migrate:test

# 4. Seed with sample data
npm run seed
```

### Seed Credentials

After running `npm run seed`:

| Role  | Email                     | Password   |
|-------|---------------------------|------------|
| ADMIN | admin@queueless.app       | Admin1234  |
| STAFF | staff@queueless.app       | Staff1234  |
| USER  | user@queueless.app        | User1234   |

---

## NPM Scripts

| Script              | Description                                    |
|---------------------|------------------------------------------------|
| `npm start`         | Start production server                        |
| `npm run dev`       | Start with nodemon (auto-reload)               |
| `npm test`          | Run all Jest tests                             |
| `npm run test:coverage` | Run tests with coverage report            |
| `npm run migrate`   | Run database migrations                        |
| `npm run migrate:test` | Migrate the test database                   |
| `npm run seed`      | Seed sample data                               |

---

## API Overview

All endpoints are prefixed with `/api`. Interactive docs: **http://localhost:5000/api-docs**

### Authentication — `/api/auth`

| Method | Endpoint                    | Auth     | Description               |
|--------|-----------------------------|----------|---------------------------|
| POST   | `/register`                 | Public   | Register new user         |
| POST   | `/login`                    | Public   | Login, get JWT            |
| GET    | `/me`                       | User+    | Get current user profile  |
| POST   | `/logout`                   | User+    | Logout (discard token)    |
| POST   | `/change-password`          | User+    | Change password           |

### Services — `/api/services`

| Method | Endpoint                         | Auth     | Description              |
|--------|----------------------------------|----------|--------------------------|
| GET    | `/`                              | Public   | List services            |
| GET    | `/:id`                           | Public   | Get service details      |
| POST   | `/`                              | Admin    | Create service           |
| PUT    | `/:id`                           | Admin    | Update service           |
| PATCH  | `/:id/deactivate`                | Admin    | Deactivate service       |
| GET    | `/:id/queue-settings`            | Staff+   | Get queue settings       |
| PUT    | `/:id/queue-settings`            | Admin    | Update queue settings    |
| GET    | `/:id/ratings`                   | Public   | Get rating summary       |
| GET    | `/:serviceId/staff`              | Admin    | List staff for service   |

### Appointments — `/api/appointments`

| Method | Endpoint                         | Auth     | Description              |
|--------|----------------------------------|----------|--------------------------|
| POST   | `/`                              | User+    | Book appointment         |
| GET    | `/my`                            | User+    | My appointments          |
| GET    | `/admin`                         | Staff+   | All appointments         |
| GET    | `/:id`                           | User+    | Get appointment          |
| PATCH  | `/:id/reschedule`                | User     | Reschedule               |
| PATCH  | `/:id/cancel`                    | User+    | Cancel                   |

### Queue — `/api/queue`

| Method | Endpoint                         | Auth     | Description              |
|--------|----------------------------------|----------|--------------------------|
| GET    | `/:serviceId`                    | User+    | Get queue + stats        |
| GET    | `/tokens/:tokenId`               | User+    | Get token by ID          |
| POST   | `/:serviceId/call-next`          | Staff+   | Call next token          |
| PATCH  | `/tokens/:tokenId/skip`          | Staff+   | Skip token               |
| PATCH  | `/tokens/:tokenId/start`         | Staff+   | Mark IN_SERVICE          |
| PATCH  | `/tokens/:tokenId/complete`      | Staff+   | Complete token           |

### Staff — `/api/staff`

| Method | Endpoint              | Auth  | Description              |
|--------|-----------------------|-------|--------------------------|
| GET    | `/my-services`        | Staff+ | My assigned services    |
| GET    | `/my-schedules`       | Staff+ | My schedules            |
| POST   | `/schedules`          | Staff+ | Add schedule            |
| DELETE | `/schedules/:id`      | Staff+ | Remove schedule         |
| POST   | `/assign`             | Admin | Assign staff to service  |
| DELETE | `/unassign`           | Admin | Remove assignment        |

### Feedback — `/api/feedback`

| Method | Endpoint   | Auth   | Description              |
|--------|------------|--------|--------------------------|
| POST   | `/`        | User+  | Submit feedback          |
| GET    | `/my`      | User+  | My feedback              |
| GET    | `/`        | Admin  | All feedback             |

### Admin — `/api/admin`

| Method | Endpoint                  | Auth  | Description              |
|--------|---------------------------|-------|--------------------------|
| GET    | `/dashboard`              | Admin | Dashboard statistics     |
| GET    | `/reports`                | Admin | Appointment reports      |
| GET    | `/users`                  | Admin | List users               |
| GET    | `/users/:id`              | Admin | Get user                 |
| PUT    | `/users/:id`              | Admin | Update user              |
| PATCH  | `/users/:id/deactivate`   | Admin | Deactivate user          |

---

## Sample Requests

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"Secret1234"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Secret1234"}'
```

### Book a Walk-in Appointment

```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"<SERVICE_UUID>","type":"WALK_IN"}'
```

### View Queue

```bash
curl http://localhost:5000/api/queue/<SERVICE_UUID> \
  -H "Authorization: Bearer <TOKEN>"
```

### Call Next Token (Staff)

```bash
curl -X POST http://localhost:5000/api/queue/<SERVICE_UUID>/call-next \
  -H "Authorization: Bearer <STAFF_TOKEN>"
```

### Complete a Token (Staff)

```bash
curl -X PATCH http://localhost:5000/api/queue/tokens/<TOKEN_UUID>/complete \
  -H "Authorization: Bearer <STAFF_TOKEN>"
```

---

## Testing

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage
```

> **Prerequisites**: The `queueless_test` PostgreSQL database must exist and migrations must be applied (`npm run migrate:test`).

### Test Suites

| File                      | Coverage                                                         |
|---------------------------|------------------------------------------------------------------|
| `auth.test.js`            | Registration, login, JWT, role-based access                      |
| `appointments.test.js`    | Booking, double-booking prevention, cancellation, ownership      |
| `queue.test.js`           | Token operations, staff authorization, sequential numbering       |
| `services.test.js`        | CRUD, deactivation, role-based access                            |

---

## Notifications

QueueLess supports email notifications for:
- **Booking confirmation** — sent on new appointment creation
- **Reschedule** — sent when appointment is rescheduled
- **Cancellation** — sent when appointment is cancelled
- **Upcoming turn** — sent when staff calls the next token

### Configuration

| `EMAIL_PROVIDER` | Behaviour                                      |
|------------------|------------------------------------------------|
| `dev` (default)  | Logs to console — safe with no credentials    |
| `smtp`           | Sends real email via Nodemailer SMTP transport |

Set `NOTIFICATIONS_ENABLED=true` in `.env` to activate delivery.

---

## Security

- Passwords hashed with **bcrypt** (configurable rounds, default 12)
- JWTs signed with secret from environment variables — never hardcoded
- **Helmet** sets security-related HTTP headers
- **CORS** restricted to configured origin
- **Rate limiting** on all `/api/` routes and stricter limits on auth routes
- All DB queries use **parameterized statements** — no SQL injection risk
- Password hashes are **never returned** in any API response
- Stack traces hidden in production error responses
- Resource ownership validated before modification

---

## Health Check

```
GET /health
```

```json
{ "status": "ok", "timestamp": "2026-10-11T09:00:00.000Z" }
```
