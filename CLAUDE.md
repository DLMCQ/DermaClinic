# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DermaClinic is a local network medical records management system for a dermatology clinic. It's a full-stack web application designed to run on a LAN server, accessible from multiple client devices on the same network.

**Key characteristics:**
- Monorepo structure with separate backend and frontend folders
- Single-PC server architecture (no cloud deployment)
- Spanish language UI and messaging
- Designed for Windows primary users with batch file launchers

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
3. **Database** (sql.js) stores data in a single file at `backend/data/dermaclinic.db`

### Backend Structure
- **server.js**: Express app initialization, serves compiled frontend from `../../frontend/build`, binds to `0.0.0.0:3001`
- **database.js**: In-memory SQLite wrapper using sql.js, exports `initDb()`, `all()`, `get()`, `run()` helper functions. Every mutation calls `saveDb()` to persist to disk.
- **routes/pacientes.js**: Patient CRUD endpoints (GET, POST, PUT, DELETE), includes search via query param `?q=`
- **routes/sesiones.js**: Treatment session CRUD endpoints

**Critical database detail**: This uses `sql.js`, NOT `better-sqlite3` despite what README might suggest. The database is loaded entirely into memory, and changes are persisted to disk via `fs.writeFileSync` after each mutation.

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
- foto_url (base64 image data)
- creado_en, actualizado_en

**sesiones** table:
- id (TEXT PRIMARY KEY, UUID)
- paciente_id (FOREIGN KEY with CASCADE DELETE)
- fecha, tratamiento, productos, notas
- imagen_antes, imagen_despues (base64 image data)
- creado_en

### API Endpoints
- `GET /api/pacientes?q=search` - List/search patients (returns patient with `total_sesiones` count)
- `GET /api/pacientes/:id` - Get patient with sessions array
- `POST /api/pacientes` - Create patient
- `PUT /api/pacientes/:id` - Update patient
- `DELETE /api/pacientes/:id` - Delete patient and cascade delete sessions
- `POST /api/sesiones` - Create session (requires paciente_id, fecha, tratamiento)
- `PUT /api/sesiones/:id` - Update session
- `DELETE /api/sesiones/:id` - Delete session
- `GET /api/health` - Health check endpoint

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
1. Update database schema in `backend/src/database.js` (add column to CREATE TABLE)
2. Add field to POST/PUT routes in `backend/src/routes/pacientes.js`
3. Add form input in `PatientForm` component in `frontend/src/App.js`
4. Add display field in patient detail view
5. Add to PDF export template in `generatePDF()` function

### Adding a new treatment type
Update the `TRATAMIENTOS` array constant at the top of `frontend/src/App.js`.

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
The entire application state is in `backend/data/dermaclinic.db`. This file should be backed up regularly. There's no automated backup system - users manually copy the file.
