# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DermaClinic is a medical records management system for a dermatology clinic. It's a full-stack web application with **dual-mode architecture** supporting both local network deployment and cloud deployment.

**Key characteristics:**
- Monorepo structure with separate backend and frontend folders
- **Dual-mode**: Local (sql.js) or Cloud (PostgreSQL on Railway)
- Spanish language UI and messaging
- JWT authentication for cloud mode
- Designed for Windows primary users with batch file launchers

## 🆕 Dual-Mode Architecture

The system evolved from local-only to support both local network and cloud deployment.

### Local Mode (`DATABASE_MODE=local`)
- Uses sql.js (in-memory SQLite)
- No authentication required (backward compatible)
- Runs on local network (`0.0.0.0:3001`)
- Data in `backend/data/dermaclinic.db`
- Images as base64 in database

### Cloud Mode (`DATABASE_MODE=cloud`)
- Uses PostgreSQL (Railway)
- JWT authentication required
- Runs on cloud platform
- Images in Railway Volumes
- Automated backups

**Switch modes by changing `.env`:**
```bash
# Local mode
DATABASE_MODE=local

# Cloud mode
DATABASE_MODE=cloud
DATABASE_URL=postgresql://...
```

### Implementation Status

**✅ Fase 1 - Fundamentos (COMPLETED):**
- Dual-mode configuration system
- Database adapter pattern (sqlite + postgres)
- JWT authentication (access + refresh tokens)
- RBAC middleware (admin/doctor roles)
- PostgreSQL migrations (initial schema, users, appointments)
- Auth endpoints (login, logout, refresh, me)
- Backward compatibility with local mode

**📋 Pending Phases:**
- Fase 2: Cloud Dashboard (estadísticas, métricas, búsquedas avanzadas)
- Fase 3: Calendario de Citas (integración con appointments table)
- Fase 4: Responsive Design (mobile-first UI)
- Fase 5: Backup Automatizado (Railway cron jobs)
- Fase 6: Gestión de Imágenes (Railway Volumes, upload directo)
- Fase 7: Testing & Deploy (Railway setup, migration guide)

**📖 Detailed Plan:**
The complete implementation plan is saved at `~/.claude/plans/sassy-squishing-locket.md` (31KB, 1133 lines)

## Development Commands

### Backend
```bash
cd backend
npm install                  # Install dependencies
npm start                    # Production server (node src/server.js)
npm run dev                  # Development with nodemon
```

### Frontend
```bash
cd frontend
npm install                  # Install dependencies
npm start                    # Development server (port 3000, proxies to backend)
npm run build:local          # Production build for local network deployment
npm run build                # Build with empty API_URL for relative paths
```

### Full System Setup (Production)
The production deployment requires building the frontend and copying it into the backend:
```bash
cd frontend && npm install && npm run build:local && cd ..
cp -r frontend/build backend/frontend  # Or use xcopy on Windows
cd backend && npm install && node src/server.js
```

On Windows, use `INSTALAR_Y_ARRANCAR.bat` for first-time setup or `ARRANCAR_SERVIDOR.bat` for daily use.

## Architecture

### Data Flow
1. **Frontend** (React SPA) makes requests to `/api/*` endpoints
2. **Backend** (Express) serves both the API and the built frontend static files
3. **Database** (dual-mode):
   - **Local**: sql.js stores data in `backend/data/dermaclinic.db`
   - **Cloud**: PostgreSQL on Railway

### Backend Structure

**Core:**
- **server.js**: Express app initialization, serves compiled frontend, binds to `0.0.0.0:3001`
- **config/index.js**: Centralized configuration (NEW in Fase 1)

**Database Layer (NEW in Fase 1):**
- **database/index.js**: Factory pattern - returns correct adapter based on `DATABASE_MODE`
- **database/sqliteAdapter.js**: Wraps sql.js for local mode
- **database/postgresAdapter.js**: Wraps pg for cloud mode
- **migrations/*.sql**: PostgreSQL migration files

**Authentication (NEW in Fase 1):**
- **utils/jwt.js**: JWT token generation and verification
- **utils/password.js**: Bcrypt password hashing
- **middleware/auth.js**: JWT authentication middleware
- **middleware/roleCheck.js**: Role-based authorization (admin/doctor)

**Routes:**
- **routes/auth.js**: Login, logout, refresh, me endpoints (NEW)
- **routes/pacientes.js**: Patient CRUD endpoints
- **routes/sesiones.js**: Treatment session CRUD endpoints

**Database Adapter Interface:**
```javascript
// All adapters implement:
await db.query(sql, params)      // Returns array of rows
await db.queryOne(sql, params)   // Returns single row or null
await db.execute(sql, params)    // Execute without return
await db.transaction(callback)   // Transaction wrapper
```

### Frontend Structure
- **App.js**: Single-file React application (~666 lines)
  - Contains all UI components (Modal, Btn, Input, Avatar, etc.)
  - Patient list sidebar with search
  - Patient detail view with sessions
  - PDF export generator using inline HTML in new window
  - Inline styles using a dark theme color palette
- **api.js**: Thin fetch wrapper for API calls, uses `REACT_APP_API_URL` environment variable
- **index.js**: React entry point

### Database Schema

**pacientes** table:
- id (TEXT PRIMARY KEY, UUID)
- nombre, dni (unique), fecha_nacimiento, telefono, email, direccion
- obra_social, nro_afiliado, motivo_consulta
- foto_url (base64 image data - legacy)
- foto_path (file path - cloud mode)
- creado_en, actualizado_en

**sesiones** table:
- id (TEXT PRIMARY KEY, UUID)
- paciente_id (FOREIGN KEY with CASCADE DELETE)
- fecha, tratamiento, productos, notas
- imagen_antes, imagen_despues (base64 image data)
- creado_en

**users** table (cloud mode only):
- id (SERIAL PRIMARY KEY)
- email (UNIQUE, NOT NULL)
- password_hash (NOT NULL)
- nombre (NOT NULL)
- role (admin | doctor)
- is_active (BOOLEAN, default true)
- created_at, updated_at

**refresh_tokens** table (cloud mode only):
- id (SERIAL PRIMARY KEY)
- token (TEXT UNIQUE, NOT NULL)
- user_id (FOREIGN KEY → users.id)
- expires_at (TIMESTAMPTZ)
- created_at

**appointments** table (cloud mode, Fase 3):
- id (SERIAL PRIMARY KEY)
- paciente_id (FOREIGN KEY → pacientes.id)
- doctor_id (FOREIGN KEY → users.id)
- fecha_hora (TIMESTAMPTZ)
- duracion_minutos (INTEGER, default 30)
- estado (pendiente | confirmada | cancelada | completada)
- notas (TEXT)
- recordatorio_enviado (BOOLEAN, default false)
- created_at, updated_at

### API Endpoints

**Authentication (NEW - cloud mode only):**
- `POST /api/auth/login` - Login with email/password, returns tokens
- `POST /api/auth/refresh` - Refresh access token with refresh token
- `POST /api/auth/logout` - Logout (invalidate refresh token)
- `GET /api/auth/me` - Get current authenticated user

**Patients:**
- `GET /api/pacientes?q=search` - List/search patients
- `GET /api/pacientes/:id` - Get patient with sessions array
- `POST /api/pacientes` - Create patient (requires auth in cloud mode)
- `PUT /api/pacientes/:id` - Update patient (requires auth in cloud mode)
- `DELETE /api/pacientes/:id` - Delete patient (requires auth in cloud mode)

**Sessions:**
- `POST /api/sesiones` - Create session (requires paciente_id, fecha, tratamiento)
- `PUT /api/sesiones/:id` - Update session
- `DELETE /api/sesiones/:id` - Delete session

**Health:**
- `GET /api/health` - Health check endpoint (returns mode, env, status)

### Image Handling
Images (patient photos, before/after treatment photos) are stored as base64-encoded data URLs directly in the database. Max size: 5MB per image (enforced in frontend). This design choice avoids file system management but increases database size.

## Important Patterns

### State Management
React useState with callback-based updates. No external state library. Patient selection triggers API call to fetch full patient with sessions.

### Error Handling
- API errors return `{ error: "message" }` with appropriate HTTP status codes
- Duplicate DNI returns 409 Conflict
- Missing resources return 404
- Validation errors return 400
- Frontend displays errors via Toast component (auto-dismisses after 3.5s)

### Network Configuration
Server binds to `0.0.0.0` to accept connections from other devices on the LAN. Users access via `http://[SERVER_IP]:3001`. Port 3001 must be open in Windows Firewall.

### Spanish Language
All UI text, error messages, comments, and variable names related to domain concepts are in Spanish. Keep this consistency when adding features.

## Common Workflows

### Adding a new patient field
**For local mode:**
1. Update schema in `backend/src/database/sqliteAdapter.js` (CREATE TABLE)
2. Add field to routes in `backend/src/routes/pacientes.js`

**For cloud mode (also do the above, plus):**
3. Create new migration file in `backend/src/migrations/`
4. Add field to PostgreSQL schema with ALTER TABLE

**For both:**
5. Add form input in `PatientForm` component in `frontend/src/App.js`
6. Add display field in patient detail view
7. Add to PDF export template in `generatePDF()` function

### Adding a new treatment type
Update the `TRATAMIENTOS` array constant at the top of `frontend/src/App.js`.

### Running in local mode vs cloud mode
**Local mode (development/local network):**
```bash
# Set in backend/.env
DATABASE_MODE=local
LOCAL_DB_PATH=../data/dermaclinic.db

cd backend && npm start
```

**Cloud mode (Railway deployment):**
```bash
# Set in Railway environment variables
DATABASE_MODE=cloud
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret>
```

### Creating a new user (cloud mode only)
Users can only be created by admins through the API:
```bash
POST /api/users
{
  "email": "doctor@dermaclinic.com",
  "password": "SecurePassword123!",
  "nombre": "Dr. García",
  "role": "doctor"  # or "admin"
}
```

### Debugging production issues
Since this runs on-site, check:
- Database file exists at `backend/data/dermaclinic.db`
- Server console output for errors
- Network connectivity: `ipconfig` on server, firewall rules
- Frontend build was copied to `backend/frontend/` directory

## Testing Strategy
This project has no automated tests. Manual testing workflow:
1. Start backend in dev mode
2. Start frontend in dev mode (separate terminal)
3. Test full CRUD flows for patients and sessions
4. Test search functionality
5. Test PDF export in different browsers
6. Test from another device on the network before deployment

## Backup and Data

**Local Mode:**
The entire application state is in `backend/data/dermaclinic.db`. This file should be backed up regularly. There's no automated backup system - users manually copy the file.

**Cloud Mode:**
- PostgreSQL data backed up by Railway (automated daily snapshots)
- Images stored in Railway Volumes (persistent storage)
- Manual exports via pg_dump can be configured

## Railway Deployment (Cloud Mode)

### Prerequisites
1. Railway account with PostgreSQL addon
2. Environment variables configured:
   - `DATABASE_MODE=cloud`
   - `DATABASE_URL` (provided by Railway PostgreSQL)
   - `JWT_ACCESS_SECRET` (64-char random string)
   - `JWT_REFRESH_SECRET` (64-char random string)
   - `NODE_ENV=production`
   - `CORS_ORIGIN` (frontend domain)

### Deployment Steps
1. Create Railway project
2. Add PostgreSQL service
3. Deploy backend service from `/backend` directory
4. Set environment variables in Railway dashboard
5. Migrations run automatically on first connect
6. Create initial admin user via direct database access

### Migration from Local to Cloud

**Option 1: Fresh Start**
- Deploy cloud instance with new database
- Create users manually
- Re-enter patient data or migrate via CSV

**Option 2: Data Migration** (requires custom script)
1. Export local SQLite data to JSON
2. Transform data format (base64 → file uploads)
3. Import into PostgreSQL via batch insert
4. Create user accounts for existing clinic staff

## Security Notes

**Local Mode:**
- No authentication (trusted local network)
- Firewall rules limit to LAN access only
- Physical security of server machine

**Cloud Mode:**
- JWT authentication required
- Passwords hashed with bcrypt (10 rounds)
- HTTPS enforced via Railway
- CORS configured for specific frontend origin
- Refresh tokens stored in database (can be revoked)
- Access tokens expire after 15 minutes

## Environment Variables Reference

```bash
# Mode selection
DATABASE_MODE=local|cloud

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development|production

# Database (local mode)
LOCAL_DB_PATH=../data/dermaclinic.db

# Database (cloud mode)
DATABASE_URL=postgresql://user:pass@host:port/db

# JWT (cloud mode only)
JWT_ACCESS_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>

# CORS
CORS_ORIGIN=*|http://specific-domain.com
```

See `backend/.env.example` for complete template.
