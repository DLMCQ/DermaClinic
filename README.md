# 🌸 DermaClinic — Sistema de Gestión Dermatológica

Sistema web de gestión de historia clínica para centro de dermatología.
**Arquitectura dual-mode**: funciona tanto en red local (SQLite) como en cloud (PostgreSQL/Railway).

---

## 🆕 Novedades - Fase 2 Completada

**✅ Nuevas características implementadas:**
- 🔐 Autenticación JWT (modo cloud)
- 📊 Dashboard con estadísticas en tiempo real
- 🔍 Búsqueda avanzada de pacientes (por tratamiento, fechas, productos)
- 📅 Sistema de calendario de citas (modo cloud)
- 👥 Gestión de usuarios con roles (admin/doctor)
- 🛡️ Seguridad mejorada (rate limiting, helmet, compression)
- ✅ Validación de datos con Joi
- 🎨 Upload de imágenes a Railway Volumes (modo cloud)

**🔜 Próximamente - Fase 3:**
- Dashboard visual con gráficos
- Interfaz de login
- Calendario interactivo
- UI responsive (mobile-first)

---

## 🎯 Modos de Operación

### Modo Local (actual)
- Base de datos: **SQLite** (archivo `backend/data/dermaclinic.db`)
- Autenticación: **No requerida**
- Red: **Solo red local**
- Ideal para: Clínicas con una sola PC o red interna

### Modo Cloud (disponible)
- Base de datos: **PostgreSQL** en Railway
- Autenticación: **JWT con roles**
- Acceso: **Desde cualquier lugar con internet**
- Ideal para: Acceso remoto, múltiples sucursales

**Cambiar de modo:** Editar `backend/.env` → `DATABASE_MODE=local` o `DATABASE_MODE=cloud`

---

## 📋 Requisitos previos

Instalar **Node.js LTS** desde: https://nodejs.org
(Versión 18 o superior. Solo se instala una vez en la PC servidora.)

---

## 🚀 Instalación (primera vez)

### En Windows:
1. Descomprimí la carpeta `dermaclinic` en cualquier lugar (ej: `C:\DermaClinic`)
2. Hacé doble clic en **`INSTALAR_Y_ARRANCAR.bat`**
3. Esperá que instale todo (puede tardar 2-3 minutos)
4. Cuando aparezca `Servidor corriendo en: http://0.0.0.0:3001`, ¡listo!

### En Mac/Linux:
```bash
cd dermaclinic
cd backend && npm install && cd ..
cd frontend && npm install && npm run build:local && cd ..
cp -r frontend/build backend/frontend
cd backend && node src/server.js
```

---

## 💻 Uso diario (después de instalar)

1. Doble clic en **`ARRANCAR_SERVIDOR.bat`** en la PC servidora
2. Abrir el navegador en **cualquier PC de la red** y entrar a:
   - PC servidora: `http://localhost:3001`
   - Otras PCs: `http://[IP-DE-LA-PC-SERVIDORA]:3001`

### ¿Cómo saber la IP de la PC servidora?
```
Windows: Abrí CMD y ejecutá: ipconfig
         Buscá "Dirección IPv4" → ejemplo: 192.168.1.50
```
→ Las otras PCs acceden entrando a: `http://192.168.1.50:3001`

---

## 🗂 Estructura del proyecto

```
dermaclinic/
├── INSTALAR_Y_ARRANCAR.bat        ← Primera instalación
├── ARRANCAR_SERVIDOR.bat          ← Uso diario
├── CLAUDE.md                      ← Documentación técnica para desarrollo
├── TEST_ENDPOINTS.md              ← Guía de testing de APIs
├── backend/
│   ├── package.json
│   ├── .env                       ← Configuración (DATABASE_MODE, secrets)
│   ├── .env.example               ← Plantilla de configuración
│   ├── src/
│   │   ├── server.js              ← Servidor Express
│   │   ├── config/
│   │   │   └── index.js           ← Configuración centralizada
│   │   ├── database/
│   │   │   ├── index.js           ← Factory (dual-mode)
│   │   │   ├── sqliteAdapter.js   ← Adapter para SQLite
│   │   │   └── postgresAdapter.js ← Adapter para PostgreSQL
│   │   ├── middleware/
│   │   │   ├── auth.js            ← Verificación JWT
│   │   │   ├── roleCheck.js       ← Control de roles
│   │   │   ├── validate.js        ← Validación Joi
│   │   │   ├── errorHandler.js    ← Manejo de errores
│   │   │   └── security.js        ← Helmet, rate limiting, compression
│   │   ├── routes/
│   │   │   ├── auth.js            ← Login, logout, refresh
│   │   │   ├── users.js           ← Gestión de usuarios (cloud)
│   │   │   ├── pacientes.js       ← CRUD pacientes + búsqueda avanzada
│   │   │   ├── sesiones.js        ← CRUD sesiones
│   │   │   ├── dashboard.js       ← Estadísticas y métricas
│   │   │   ├── appointments.js    ← Calendario de citas (cloud)
│   │   │   └── images.js          ← Upload a Railway Volumes (cloud)
│   │   ├── utils/
│   │   │   ├── jwt.js             ← Generación/verificación tokens
│   │   │   └── password.js        ← Bcrypt hashing
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql
│   │       ├── 002_users_auth.sql
│   │       └── 003_appointments.sql
│   └── data/
│       └── dermaclinic.db         ← Base de datos SQLite (modo local)
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js                 ← Aplicación React (SPA)
        └── api.js                 ← Cliente HTTP
```

---

## 💾 Base de datos

### Modo Local
Los datos se guardan en: `backend/data/dermaclinic.db`

**⚠️ Importante — Backup:**
Copiá regularmente el archivo `dermaclinic.db` a un pendrive o carpeta compartida como respaldo.

### Modo Cloud
- Base de datos PostgreSQL en Railway
- Backups automáticos diarios (configurables)
- Datos persistentes en Railway Volumes

---

## 🌐 API REST disponible

### Endpoints Principales

| Método | Ruta                              | Descripción                    | Modo   |
|--------|-----------------------------------|--------------------------------|--------|
| GET    | /api/health                       | Estado del servidor            | Ambos  |
| GET    | /api/pacientes                    | Listar pacientes               | Ambos  |
| GET    | /api/pacientes?q=texto            | Buscar por nombre/DNI          | Ambos  |
| GET    | /api/pacientes?tratamiento=X      | Buscar por tratamiento         | Ambos  |
| GET    | /api/pacientes?fecha_desde=YYYY-MM-DD | Buscar por rango de fechas | Ambos  |
| GET    | /api/pacientes/:id                | Ver ficha completa             | Ambos  |
| POST   | /api/pacientes                    | Crear paciente                 | Ambos  |
| PUT    | /api/pacientes/:id                | Editar paciente                | Ambos  |
| DELETE | /api/pacientes/:id                | Eliminar paciente              | Ambos  |
| POST   | /api/sesiones                     | Crear sesión                   | Ambos  |
| PUT    | /api/sesiones/:id                 | Editar sesión                  | Ambos  |
| DELETE | /api/sesiones/:id                 | Eliminar sesión                | Ambos  |

### Endpoints Nuevos (Fase 2)

| Método | Ruta                              | Descripción                    | Modo   |
|--------|-----------------------------------|--------------------------------|--------|
| POST   | /api/auth/login                   | Login (email/password)         | Cloud  |
| POST   | /api/auth/refresh                 | Renovar access token           | Cloud  |
| POST   | /api/auth/logout                  | Cerrar sesión                  | Cloud  |
| GET    | /api/auth/me                      | Usuario actual                 | Cloud  |
| GET    | /api/dashboard/stats              | Estadísticas generales         | Ambos  |
| GET    | /api/dashboard/stats/range        | Stats por rango de fechas      | Ambos  |
| GET    | /api/dashboard/activity           | Actividad reciente             | Ambos  |
| GET    | /api/users                        | Listar usuarios                | Cloud  |
| POST   | /api/users                        | Crear usuario                  | Cloud  |
| PUT    | /api/users/:id                    | Actualizar usuario             | Cloud  |
| DELETE | /api/users/:id                    | Desactivar usuario             | Cloud  |
| GET    | /api/appointments                 | Listar citas                   | Cloud  |
| POST   | /api/appointments                 | Crear cita                     | Cloud  |
| PUT    | /api/appointments/:id             | Actualizar cita                | Cloud  |
| DELETE | /api/appointments/:id             | Eliminar cita                  | Cloud  |
| POST   | /api/images/upload                | Subir imagen                   | Cloud  |
| DELETE | /api/images/delete                | Eliminar imagen                | Cloud  |

**📖 Documentación completa:** Ver `TEST_ENDPOINTS.md`

---

## 🔐 Seguridad (Fase 2)

### Rate Limiting
- **General**: 100 requests / 15 minutos
- **Auth**: 5 intentos de login / 15 minutos
- Previene ataques de fuerza bruta

### Validación de Datos
- Joi schemas para todos los endpoints
- Validación automática de tipos, formatos y requerimientos
- Mensajes de error descriptivos

### Autenticación (Modo Cloud)
- JWT con access tokens (15 min) y refresh tokens (7 días)
- Passwords hasheados con bcrypt (10 rounds)
- Tokens revocables en base de datos

### Headers de Seguridad
- Helmet configurado (XSS, CSRF, clickjacking)
- CORS restrictivo (configurable por dominio)
- Compression para mejor performance

---

## 🧪 Testing

Para probar los endpoints nuevos:

```bash
# Ver estado del servidor
curl http://localhost:3001/api/health

# Ver estadísticas
curl http://localhost:3001/api/dashboard/stats

# Buscar pacientes por tratamiento
curl "http://localhost:3001/api/pacientes?tratamiento=Botox"

# Crear paciente con validación
curl -X POST http://localhost:3001/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana García","dni":"12345678"}'
```

**📖 Guía completa de testing:** Ver `TEST_ENDPOINTS.md`

---

## ⚙️ Configuración Avanzada

### Variables de Entorno (`backend/.env`)

```bash
# Modo de operación
DATABASE_MODE=local              # local | cloud

# Servidor
PORT=3001
HOST=0.0.0.0
NODE_ENV=development             # development | production

# Base de datos (modo local)
LOCAL_DB_PATH=../data/dermaclinic.db

# Base de datos (modo cloud)
DATABASE_URL=postgresql://user:pass@host:port/db

# JWT Secrets (modo cloud)
JWT_ACCESS_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>

# CORS
CORS_ORIGIN=*                    # * | http://specific-domain.com
```

**📖 Ver:** `backend/.env.example` para plantilla completa

---

## 🚀 Deploy a Railway (Modo Cloud)

1. Crear cuenta en [railway.app](https://railway.app)
2. Nuevo proyecto desde GitHub
3. Agregar PostgreSQL addon
4. Agregar Railway Volumes:
   - `/app/uploads` (2GB) para imágenes
   - `/app/backups` (1GB) para backups
5. Configurar variables de entorno:
   ```
   DATABASE_MODE=cloud
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_ACCESS_SECRET=<generar>
   JWT_REFRESH_SECRET=<generar>
   NODE_ENV=production
   ```
6. Deploy automático con Git push

**📖 Guía completa:** Ver `~/.claude/plans/sassy-squishing-locket.md`

---

## ❓ Solución de problemas

**El servidor no arranca:**
- Verificar que Node.js esté instalado: `node --version`
- Verificar que el puerto 3001 no esté ocupado
- Revisar logs en la consola para errores específicos

**"getDb is not a function":**
- Renombrar o eliminar el archivo antiguo `backend/src/database.js`
- El sistema ahora usa `backend/src/database/index.js`

**Las otras PCs no pueden conectarse:**
- Verificar que están en la misma red WiFi/LAN
- Verificar que el firewall de Windows permite conexiones al puerto 3001:
  - Panel de control → Firewall → Reglas de entrada → Nueva regla → Puerto 3001

**Se perdieron los datos (modo local):**
- Los datos están en `backend/data/dermaclinic.db`
- Restaurar el archivo desde el último backup

**Errores de validación:**
- Ver `TEST_ENDPOINTS.md` para formato correcto de requests
- Los endpoints ahora validan todos los campos con Joi
- Mensajes de error indican qué campo falla y por qué

**Modo cloud no requiere auth:**
- Verificar `DATABASE_MODE=cloud` en `.env`
- Endpoints cloud-only requieren header: `Authorization: Bearer <token>`
- Obtener token con `POST /api/auth/login`

---

## 📊 Estadísticas del Proyecto

**Backend:**
- Líneas de código: ~2,500
- Endpoints: 30+
- Middleware: 7
- Adaptadores de DB: 2 (SQLite, PostgreSQL)

**Frontend:**
- Componentes: 1 archivo (App.js) - Fase 3 refactorizará en ~30 componentes
- Líneas: ~666

**Dependencias principales:**
- Express 4.18
- React 18
- Joi (validación)
- jsonwebtoken (JWT)
- bcryptjs (passwords)
- helmet (seguridad)
- multer (uploads)

---

## 📞 Tecnologías utilizadas

**Frontend:**
- React 18
- CSS-in-JS
- Fetch API

**Backend:**
- Node.js
- Express
- Joi (validación)
- JWT (autenticación)
- Bcrypt (hashing)
- Helmet (seguridad)
- Morgan (logging)

**Base de datos:**
- SQLite (sql.js) - modo local
- PostgreSQL (pg) - modo cloud

**Infraestructura Cloud:**
- Railway (hosting)
- Railway PostgreSQL (base de datos)
- Railway Volumes (archivos)

---

## 📝 Roadmap

- [x] **Fase 1**: Sistema Dual-Mode + Autenticación JWT ✅
- [x] **Fase 2**: Backend completo (APIs, validación, seguridad) ✅
- [ ] **Fase 3**: Frontend Refactor (componentes, routing, auth UI)
- [ ] **Fase 4**: Dashboard visual con gráficos
- [ ] **Fase 5**: Calendario interactivo (react-big-calendar)
- [ ] **Fase 6**: Responsive Design (mobile-first)
- [ ] **Fase 7**: Deploy a Railway + Migración de datos

**Estado actual:** Fase 2 completada (backend completo)

---

## 🤝 Desarrollo

**Archivos importantes para desarrolladores:**
- `CLAUDE.md` - Documentación técnica completa
- `TEST_ENDPOINTS.md` - Guía de testing de APIs
- `~/.claude/plans/sassy-squishing-locket.md` - Plan completo de migración (31KB)

**Estructura de commits:**
```bash
git log --oneline
# 0add1 feat: Implementar Fase 1 - Foundation
# f27ca claude.md
# 5180a first commit
```

---

*DermaClinic v2.0 — Sistema dual-mode con arquitectura cloud-ready*
*Última actualización: Febrero 2026 - Fase 2 completada*
