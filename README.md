# DermaClinic

Web-based clinical management system for dermatology centers. Allows practitioners to manage patient records, treatment sessions, appointments, and clinical history through a centralized cloud interface.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

---

## Tech Stack

**Frontend**
- React 18 (SPA)
- React Router v6
- React Big Calendar
- Vite (build tool)

**Backend**
- Node.js v24
- Express 4
- JSON Web Tokens (jsonwebtoken)
- bcryptjs
- Joi (schema validation)
- Helmet, express-rate-limit (security)
- Multer (file uploads)
- Morgan (HTTP logging)

**Database**
- PostgreSQL
- node-postgres / pg (connection pool)

**Infrastructure**
- Railway (hosting, database, volumes)

---

## Architecture

The application follows a standard client-server architecture. The React frontend is compiled by Vite and served as static files by the Express server. All data access goes through a REST API authenticated via JWT.

```
Client (Browser)
      |
      | HTTPS
      v
Express Server (Node.js) — Port 3001
      |
      | SQL via pg connection pool
      v
PostgreSQL (Railway)
```

The backend exposes a REST API under `/api/`. Every endpoint except `/api/auth/login` and `/api/health` requires a valid Bearer token. Role-based access control restricts admin-only operations such as user management.

---

## Project Structure

```
DermaClinic/
├── railway.json
├── start.sh
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js               # Express app entry point
│       ├── config/
│       │   └── index.js            # Centralized configuration
│       ├── database/
│       │   ├── index.js            # Database initialization
│       │   └── postgresAdapter.js  # pg Pool wrapper (query, queryOne, execute, transaction)
│       ├── middleware/
│       │   ├── auth.js             # JWT verification
│       │   ├── roleCheck.js        # Role-based access control
│       │   ├── validate.js         # Joi request validation
│       │   ├── errorHandler.js     # Global error handler
│       │   └── security.js         # Helmet, rate limiting, compression
│       ├── routes/
│       │   ├── auth.js             # Login, logout, token refresh
│       │   ├── users.js            # User management (admin only)
│       │   ├── pacientes.js        # Patient CRUD + advanced search
│       │   ├── sesiones.js         # Treatment session CRUD
│       │   ├── appointments.js     # Appointment calendar
│       │   ├── dashboard.js        # Metrics and statistics
│       │   └── images.js           # Image upload to Railway Volumes
│       ├── utils/
│       │   ├── jwt.js              # Token generation and verification
│       │   └── password.js         # bcrypt hashing
│       └── migrations/
│           ├── 001_initial_schema.sql
│           ├── 002_users_auth.sql
│           └── 003_appointments.sql
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.jsx
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── PatientsPage.jsx
        │   ├── AppointmentsPage.jsx
        │   └── UsersPage.jsx
        ├── components/
        │   ├── auth/
        │   ├── common/
        │   ├── layout/
        │   ├── patients/
        │   └── sessions/
        ├── context/
        ├── hooks/
        └── utils/
```

---

## API Reference

All endpoints require `Authorization: Bearer <token>` unless noted.

### Authentication

| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| POST | /api/auth/login | Authenticate and receive tokens | No |
| POST | /api/auth/refresh | Refresh access token | No |
| POST | /api/auth/logout | Invalidate refresh token | No |
| GET | /api/auth/me | Get current user | Yes |

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/pacientes | List all patients. Supports query params: `q`, `tratamiento`, `fecha_desde`, `fecha_hasta`, `productos` |
| GET | /api/pacientes/:id | Get patient with full session history |
| POST | /api/pacientes | Create patient |
| PUT | /api/pacientes/:id | Update patient |
| DELETE | /api/pacientes/:id | Delete patient |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sesiones | Create treatment session |
| PUT | /api/sesiones/:id | Update session |
| DELETE | /api/sesiones/:id | Delete session |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/appointments | List appointments. Supports: `fecha_desde`, `fecha_hasta`, `paciente_id`, `estado`, `doctor_id` |
| GET | /api/appointments/:id | Get appointment by ID |
| POST | /api/appointments | Create appointment |
| PUT | /api/appointments/:id | Update appointment |
| PATCH | /api/appointments/:id/complete | Mark as completed |
| PATCH | /api/appointments/:id/cancel | Cancel appointment |
| DELETE | /api/appointments/:id | Delete appointment |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | General statistics |
| GET | /api/dashboard/stats/range | Statistics for a date range (`fecha_desde`, `fecha_hasta`) |
| GET | /api/dashboard/activity | Recent session activity |

### Users (admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

### Images

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/images/upload | Upload image to Railway Volume |
| DELETE | /api/images/delete | Delete image |
| GET | /api/images/info | Get image metadata |

### System

| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| GET | /api/health | Server and database status | No |

---

## Security

**Authentication**
- Access tokens expire after 8 hours (JWT signed with HS256)
- Refresh tokens stored in the database and revocable on logout
- Passwords hashed with bcrypt (10 rounds)

**Rate Limiting**
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP

**HTTP Security**
- Helmet sets secure response headers (XSS protection, content type, frameguard)
- CORS restricted to configured origin
- Response compression via gzip

**Authorization**
- Role-based access control with two roles: `admin` and `doctor`
- Admin-only routes: user management
- All other routes require any authenticated user

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```env
NODE_ENV=production

PORT=3001
HOST=0.0.0.0

DATABASE_URL=postgresql://user:password@host:5432/database

JWT_ACCESS_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>

CORS_ORIGIN=https://your-domain.com

UPLOADS_PATH=/app/uploads
BACKUP_ENABLED=false
BACKUP_PATH=/app/backups
```

Generate JWT secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Getting Started

**Prerequisites**
- Node.js 18 or higher
- A PostgreSQL instance (local or remote)

**Install dependencies**
```bash
cd backend && npm install
cd ../frontend && npm install
```

**Run in development**
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm start
```

**Build frontend for production**
```bash
cd frontend && npm run build
```

The compiled output goes to `frontend/build/` and is served automatically by Express.

---

## Deployment

The project is configured for Railway. Every push to the main branch triggers an automatic deploy.

**Setup steps:**

1. Create a new project on [Railway](https://railway.app)
2. Connect the GitHub repository
3. Add a PostgreSQL plugin — Railway injects `DATABASE_URL` automatically
4. Add a Railway Volume mounted at `/app/uploads` for image storage
5. Set the environment variables listed above in the Railway dashboard
6. Deploy

Migrations run automatically on server startup. No manual database setup is required.
