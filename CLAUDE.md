# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Backend (from backend/)
npm run dev       # nodemon watch
npm start         # node src/server.js
npm run seed      # seed demo users

# Frontend (from frontend/)
npm start         # vite dev server (port 3000)
npm run build     # compile to frontend/build/
npm run preview   # preview production build
```

### Production (Railway)
```bash
bash start.sh     # installs, builds frontend, seeds DB, starts server
```

After any frontend source change, rebuild and commit the build:
```bash
cd frontend && npm run build
git add frontend/build/ frontend/src/
git commit -m "..."
git push origin Hostinger
```

## Architecture

**Single-server SPA:** Express serves the compiled React app (`frontend/build/`) as static files and all API calls go to `/api/*` on the same origin. No separate frontend server in production.

**Request flow:**
```
Browser → Express (port 3001)
  ├── /api/*  → JWT auth → route handler → MySQL → JSON response
  └── /*      → serve frontend/build/index.html (SPA fallback)
```

**Frontend → Backend connection:** In dev, Vite proxies `/api` to `localhost:3001`. In production, same origin.

## Database

MySQL via `mysql2/promise`. Driver: `backend/src/database/mysqlAdapter.js`.

- Queries use `?` placeholders (not `$1`)
- No `RETURNING` clause — do a separate SELECT after INSERT/UPDATE
- UUIDs generated in app via `uuidv4()` for all tables (except `refresh_tokens.id` which is INT AUTO_INCREMENT)
- `BOOLEAN` stored as `TINYINT(1)`
- Migrations run automatically on startup from `backend/src/migrations/*.sql`

**Adapter methods:** `query`, `queryOne`, `execute`, `transaction`

## Authentication

JWT dual-token flow:
- **Access token** (15 min): `{ userId, role }` — sent as `Authorization: Bearer <token>`
- **Refresh token** (7 days): stored in MySQL `refresh_tokens` table
- Frontend auto-refreshes on 401 and retries the original request (`frontend/src/utils/api.js`)
- `AuthContext` manages token state and expiry callbacks

## Image Uploads

Cloudinary (not base64, not local disk):
1. Frontend POSTs FormData to `/api/images/upload`
2. Multer memoryStorage (max 5MB) → streams to Cloudinary
3. Response `{ url, public_id }` — URL stored in DB
4. Folders: `dermaclinic/patients`, `dermaclinic/sessions`

Required env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Environment Variables

```env
DATABASE_URL=mysql://user:pass@host:3306/db
JWT_ACCESS_SECRET=<64-char random>
JWT_REFRESH_SECRET=<64-char random>
NODE_ENV=production
PORT=3001
CORS_ORIGIN=*
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Generate secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/server.js` | Express app setup, middleware stack, static serving |
| `backend/src/database/mysqlAdapter.js` | MySQL adapter (query/execute/transaction/migrate) |
| `backend/src/config/index.js` | All env var parsing |
| `backend/src/middleware/auth.js` | JWT verify + role check |
| `backend/src/routes/` | `auth`, `users`, `pacientes`, `sesiones`, `appointments`, `images`, `dashboard` |
| `frontend/src/utils/api.js` | Centralized fetch client with auto token refresh |
| `frontend/src/context/AuthContext.jsx` | Auth state, login/logout |
| `start.sh` | Production startup script (Railway) |

## Middleware Order

helmet → compression → cors → express.json → rate limiting → routes → error handler

Auth rate limit: 5 req/15min. General: 100 req/15min.

## UI Language

All UI text and comments are in **Spanish**.
