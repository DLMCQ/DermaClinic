# 🧪 Test de Endpoints - Fase 2

## Estado Actual
- **Modo**: Local (SQLite)
- **Auth**: No requerida en modo local
- **Base de datos**: `backend/data/dermaclinic.db`

---

## ✅ Endpoints Disponibles

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

**Response esperado:**
```json
{
  "status": "ok",
  "mode": "local",
  "database": "sqlite",
  "env": "development",
  "timestamp": "2026-02-27T..."
}
```

---

### 2. Dashboard - Estadísticas Generales
```bash
curl http://localhost:3001/api/dashboard/stats
```

**Response esperado:**
```json
{
  "totalPatients": 1,
  "newPatientsThisMonth": 1,
  "totalSessions": 0,
  "sessionsThisMonth": 0,
  "upcomingAppointments": 0,
  "topTreatments": [],
  "recentPatients": [...]
}
```

**📊 Qué muestra:**
- Total de pacientes
- Pacientes nuevos este mes
- Total de sesiones
- Sesiones este mes
- Top 5 tratamientos más usados
- Últimas 5 pacientes creadas

---

### 3. Dashboard - Estadísticas por Rango
```bash
curl "http://localhost:3001/api/dashboard/stats/range?fecha_desde=2026-01-01&fecha_hasta=2026-12-31"
```

**Response esperado:**
```json
{
  "sessionsInRange": 0,
  "patientsInRange": 1,
  "treatmentsByRange": []
}
```

---

### 4. Dashboard - Actividad Reciente
```bash
curl "http://localhost:3001/api/dashboard/activity?limit=10"
```

**Response esperado:**
```json
[
  {
    "id": "uuid",
    "fecha": "2026-02-26",
    "tratamiento": "Láser CO2",
    "created_at": "2026-02-26T...",
    "paciente_id": "uuid",
    "paciente_nombre": "Ana García"
  }
]
```

---

### 5. Pacientes - Listar (sin filtros)
```bash
curl http://localhost:3001/api/pacientes
```

---

### 6. Pacientes - Búsqueda Simple
```bash
curl "http://localhost:3001/api/pacientes?q=Ana"
```

**Busca en:** nombre y DNI

---

### 7. Pacientes - Búsqueda Avanzada (NUEVO ✨)
```bash
# Por tratamiento recibido
curl "http://localhost:3001/api/pacientes?tratamiento=Botox"

# Por rango de fechas
curl "http://localhost:3001/api/pacientes?fecha_desde=2026-01-01&fecha_hasta=2026-12-31"

# Por productos utilizados
curl "http://localhost:3001/api/pacientes?productos=Restylane"

# Combinado
curl "http://localhost:3001/api/pacientes?q=Ana&tratamiento=Botox&fecha_desde=2026-01-01"
```

---

### 8. Pacientes - Crear con Validación
```bash
curl -X POST http://localhost:3001/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María López",
    "dni": "98765432",
    "telefono": "555-1234",
    "email": "maria@example.com",
    "fecha_nacimiento": "1990-05-15"
  }'
```

**✅ Validaciones automáticas (Joi):**
- `nombre`: mínimo 2 caracteres, máximo 255
- `dni`: mínimo 6 caracteres, máximo 50, único
- `email`: formato válido
- Campos opcionales pueden ser null o vacíos

**❌ Errores de validación:**
```bash
curl -X POST http://localhost:3001/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{"nombre": "A"}'
```

Response:
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "nombre",
      "message": "\"nombre\" length must be at least 2 characters long"
    },
    {
      "field": "dni",
      "message": "\"dni\" is required"
    }
  ]
}
```

---

### 9. Sesiones - Crear con Validación
```bash
curl -X POST http://localhost:3001/api/sesiones \
  -H "Content-Type: application/json" \
  -d '{
    "paciente_id": "e1b7c02b-c623-40f5-9fa6-ae8f4c90934c",
    "fecha": "2026-02-26",
    "tratamiento": "Limpieza Facial",
    "productos": "Producto X, Producto Y",
    "notas": "Paciente respondió bien al tratamiento"
  }'
```

---

### 10. Endpoints Cloud-Only (devuelven 404 en modo local)

```bash
# Gestión de Usuarios
curl http://localhost:3001/api/users
# Response: {"error": "Endpoint solo disponible en modo cloud"}

# Calendario de Citas
curl http://localhost:3001/api/appointments
# Response: {"error": "Calendario de citas solo disponible en modo cloud"}

# Upload de Imágenes a Volumen
curl -X POST http://localhost:3001/api/images/upload
# Response: {"error": "Upload de imágenes a volumen solo disponible en modo cloud. En modo local use base64."}
```

---

## 🔐 Seguridad Implementada

### Rate Limiting
```bash
# Intenta hacer 101 requests en 15 minutos
for i in {1..101}; do curl http://localhost:3001/api/health; done
```

**Después de 100 requests:**
```json
{
  "error": "Demasiadas peticiones desde esta IP, por favor intente más tarde"
}
```

### Compression
```bash
curl -I http://localhost:3001/api/pacientes
```

**Headers esperados:**
```
Content-Encoding: gzip
```

### Security Headers (Helmet)
```bash
curl -I http://localhost:3001/api/health
```

**Headers esperados:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
...
```

---

## 🎨 Frontend Actual (sin cambios aún)

**El frontend NO muestra estos nuevos features todavía** porque Fase 3 (Frontend Refactor) no está implementada.

### Lo que SÍ puedes ver en el navegador:
1. Ir a `http://localhost:3001`
2. Ver la aplicación actual (single-file React)
3. CRUD de pacientes funciona (usando las nuevas APIs)
4. CRUD de sesiones funciona

### Lo que NO puedes ver (requiere Fase 3):
❌ Dashboard con estadísticas
❌ Pantalla de login
❌ Búsqueda avanzada UI
❌ Calendario de citas
❌ Gestión de usuarios

---

## 🧪 Cómo Testear Todo

### Opción 1: cURL (terminal)
```bash
# Ver este archivo para todos los ejemplos
cat TEST_ENDPOINTS.md
```

### Opción 2: Postman/Insomnia
1. Importar los endpoints
2. Base URL: `http://localhost:3001`
3. Probar cada endpoint

### Opción 3: Navegador (solo GET)
```
http://localhost:3001/api/health
http://localhost:3001/api/dashboard/stats
http://localhost:3001/api/pacientes
```

---

## 📊 Logs del Servidor

Puedes ver los logs del servidor para debugging:

```bash
# En desarrollo, Morgan muestra cada request:
GET /api/health 200 5.123 ms - 145
POST /api/pacientes 201 12.456 ms - 312
GET /api/dashboard/stats 200 8.789 ms - 256
```

---

## 🚀 Próximos Pasos (Fase 3)

Para **ver visualmente** estos nuevos features, necesitamos Fase 3:

1. **Refactorizar Frontend**
   - Extraer componentes
   - Crear Dashboard page
   - Crear búsqueda avanzada UI

2. **Implementar Auth UI**
   - Login page
   - Context de autenticación
   - Protected routes

3. **Nuevas Páginas**
   - `/dashboard` - Estadísticas visuales
   - `/appointments` - Calendario de citas
   - `/users` - Gestión de usuarios (admin)

---

## ✅ Resumen

**Actualmente funcionando (backend):**
- ✅ 12 endpoints nuevos
- ✅ Validación con Joi
- ✅ Rate limiting
- ✅ Compression
- ✅ Security headers
- ✅ Error handling centralizado
- ✅ Filtros avanzados
- ✅ Dashboard stats API

**Esperando Fase 3 (frontend):**
- ⏳ UI para dashboard
- ⏳ UI para búsqueda avanzada
- ⏳ UI para calendario
- ⏳ Login screen
- ⏳ Gestión de usuarios

¿Quieres que continuemos con **Fase 3: Frontend Refactor** para que puedas VER todo esto en la interfaz? 🚀
