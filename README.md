
# QueueLess – Digital Appointment Management System

## 📌 Project Overview

QueueLess is a web-based Digital Appointment Management System designed to simplify appointment booking and queue management. It helps users avoid long physical queues by allowing them to book appointments online, select available time slots and receive unique digital queue tokens.

Users can track their queue position, view the currently serving token and check estimated waiting times. Staff members can manage appointments and update queue statuses, while administrators can manage the complete system through a centralized dashboard.

The main goal of QueueLess is to reduce waiting time, minimize manual work and improve the overall service experience.

## 🎯 Objectives

- Provide an easy online appointment booking system.
- Reduce physical queues and unnecessary waiting time.
- Generate unique digital queue tokens automatically.
- Enable live queue tracking.
- Simplify appointment management for staff.
- Provide centralized administration.
- Improve communication through notifications.
- Maintain appointment history and customer feedback.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Angular, TypeScript |
| UI Design | HTML, CSS, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT |
| Password Security | bcrypt |
| API Testing | Postman |
| API Documentation | Swagger |
| Testing | Jest |
| Version Control | Git, GitHub |

## ✨ Key Features

### 1. User Module
- User registration and secure login.
- Browse available services.
- Book appointments using available time slots.
- Receive unique digital queue tokens.
- Track live queue position.
- View estimated waiting time.
- Reschedule or cancel appointments.
- View appointment history.
- Submit feedback and ratings.

### 2. Staff Module
- Secure staff login.
- View assigned appointments.
- Manage daily queues.
- Call the next token.
- Skip or recall tokens.
- Mark appointments as completed.
- Update appointment statuses.

### 3. Admin Module
- Centralized admin dashboard.
- Manage users and staff.
- Add, update and manage services.
- Configure appointment schedules.
- Monitor all appointments and queues.
- Manage priority appointments.
- View reports and analytics.
- Monitor notification delivery.
- Manage application settings and permissions.

### 4. Queue Management
- Automatic digital token generation.
- Separate token sequences for services and operating dates.
- Live queue status updates.
- Current serving token display.
- Waiting customer count.
- Estimated waiting time.
- Priority queue handling.

### 5. Notification Management
- Appointment booking confirmation.
- Appointment reminders.
- Upcoming-turn notifications.
- Rescheduling and cancellation updates.
- Email and SMS integration.

### 6. Reports and Analytics
- Daily and monthly appointment statistics.
- Completed and pending appointments.
- Cancelled appointment reports.
- Average waiting time.
- Service-wise performance.
- Customer feedback analysis.

## 🔄 Application Workflow

1. Users register or log in to the application.
2. Users select an available service.
3. Users choose a preferred date and time slot.
4. The system verifies availability and confirms the appointment.
5. A unique digital queue token is generated.
6. Users track their queue status through the dashboard.
7. Staff members call tokens and update appointment statuses.
8. The system updates queue information.
9. After service completion, users can submit feedback.

## 🗄️ Database Structure

The application uses PostgreSQL to store and manage information.

Proposed database tables:

| Table | Description |
|---|---|
| users | User, staff and admin account information |
| services | Available service details |
| staff | Staff information and assignments |
| appointments | Appointment booking records |
| service_schedules | Service availability and schedules |
| queue | Daily queue information |
| queue_tokens | Digital token records |
| feedback | Customer feedback and ratings |
| notifications | Notification records |
| appointment_history | Appointment status history |

## 📁 Project Structure

```text
QueueLess/
│
├── frontend/
│   └── Angular Application
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── tests/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── docs/
│   └── project-documentation.md
│
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js and npm
- Angular CLI
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/T-Yasaswini22/queue.git
```

```bash
cd queue
```

### 2. Database Setup

1. Start PostgreSQL.
2. Create a database named `queueless_db`.
3. Execute the database schema file.
4. Insert development data if required.

```sql
CREATE DATABASE queueless_db;
```

Run the SQL scripts using PostgreSQL or pgAdmin.

### 3. Backend Setup

```bash
cd Backend
npm install
```

Configure the `.env` file:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=queueless_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

Start the backend:

```bash
npm run dev
```

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Start the Angular application:

```bash
ng serve
```

Open the application in your browser:

```text
http://localhost:4200
```

## 🔐 Security

- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control.
- Protected API endpoints.
- Input validation.
- Parameterized SQL queries.
- Secure environment configuration.
- Database constraints and transactions.

## 🧪 Testing

The application uses:

- **Postman:** API testing.
- **Swagger:** API documentation.
- **Jest:** Backend unit and integration testing.

Important workflows such as registration, login, appointment booking, token generation and queue management should be tested.

## 🚀 Future Enhancements

- QR code-based token verification.
- Android and iOS mobile application.
- AI-based waiting time prediction.
- Multiple branch management.
- Multi-language support.
- Digital payment integration.
- Advanced analytics.

## 🎯 Expected Outcome

QueueLess aims to provide a convenient and efficient digital appointment management solution. It reduces unnecessary waiting, improves staff productivity and helps organizations manage appointments through a centralized platform.

## 👩‍💻 Author

**T. Yasaswini**

GitHub: [T-Yasaswini22](https://github.com/T-Yasaswini22)

---

*QueueLess – Book Smart. Wait Less.*
