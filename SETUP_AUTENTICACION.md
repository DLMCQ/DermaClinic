# Configuración de Autenticación - DermaClinic

## Problema Resuelto: "No token provided"

El error "No token provided" ocurrió porque la aplicación estaba en modo **cloud** (PostgreSQL) y requiere autenticación JWT, pero el frontend no tenía implementado el sistema de login.

## Solución Implementada

### ✅ Cambios Realizados

1. **Frontend (`src/api.js`)**
   - Agregada función `login()` para obtener tokens
   - Los tokens ahora se envían automáticamente en el header `Authorization: Bearer <token>` de todas las peticiones
   - Función `logout()` para limpiar tokens

2. **Frontend (`src/App.js`)**
   - Nueva pantalla de login con validación
   - El usuario se almacena en `localStorage`
   - Se muestra el email del usuario en el header
   - Botón de "Cerrar sesión" en el header

3. **Backend (`src/seed.js`)**
   - Script para crear usuario de demostración automáticamente

## Cómo Inicializar la Aplicación

### Paso 1: Ejecutar el Backend
```bash
cd backend
npm install  # Si no lo has hecho
node src/seed.js  # Crear usuario demo
npm start
```

El servidor iniciará en `http://localhost:3001`

### Paso 2: Compilar el Frontend
```bash
cd frontend
npm install  # Si no lo has hecho
npm run build:local
# O para desarrollo:
npm start
```

### Paso 3: Acceder a la Aplicación
Abre `http://localhost:3001` (o `http://localhost:3000` si usas npm start en frontend)

## Credenciales de Prueba

```
Email: demo@dermaclinic.com
Contraseña: password
```

⚠️ **IMPORTANTE**: Cambia estas credenciales antes de usar en producción

## Cómo Funciona la Autenticación

1. **Login**
   - Usuario ingresa email y contraseña
   - Frontend envía POST a `/api/auth/login`
   - Backend valida y retorna `accessToken` y `refreshToken`
   - Tokens se guardan en `localStorage`

2. **Peticiones Autenticadas**
   - Cada petición incluye el token en el header:
     ```
     Authorization: Bearer <accessToken>
   ```
   - Backend valida el token en el middleware de autenticación

3. **Logout**
   - Se elimina el token de `localStorage`
   - Se limpia la sesión y se redirige al login

## Crear Nuevos Usuarios (Manual)

Desde la base de datos PostgreSQL:

```sql
-- Primero hash la contraseña usando bcrypt desde Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('new-password', 10);

INSERT INTO users (email, password_hash, nombre, role, is_active) 
VALUES ('doctor@dermaclinic.com', '<hash-bcrypt>', 'Dr. Nombre', 'doctor', true);
```

O usa: `npm run seed` para crear el usuario demo nuevamente

## Estructura de Tokens

### Access Token
- Válido por: 1 hora (configurable)
- Contiene: `userId`, `email`, `role`
- Se envía en todas las peticiones

### Refresh Token
- Válido por: 7 días
- Se almacena en base de datos
- Se usa para obtener un nuevo access token cuando expira

## Resolución de Problemas

### "No token provided"
- ✅ Ya resuelto - ejecuta `node src/seed.js` para crear usuario
- Verifica que tengas acceso a la base de datos PostgreSQL

### "Invalid or expired token"
- Los tokens expiran después de 1 hora
- El frontend debería renovar automáticamente
- Limpia el localStorage y vuelve a hacer login

### No puedo conectar a PostgreSQL
- Verifica que PostgreSQL esté ejecutándose
- Confirma `DATABASE_URL` en `.env`
- Prueba conexión: `psql $DATABASE_URL`

## Variables de Entorno

En `backend/.env`:

```env
DATABASE_MODE=cloud  # 'cloud' para PostgreSQL o 'local' para SQLite
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_ACCESS_SECRET=<secret-muy-largo-min-64-chars>
JWT_REFRESH_SECRET=<secret-muy-largo-min-64-chars>
CORS_ORIGIN=*
```

## Seguridad

>  En producción:
- [ ] Cambia `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` por valores únicos y largos
- [ ] Cambia `CORS_ORIGIN` a tu dominio específico (no uses `*`)
- [ ] Usa HTTPS en production
- [ ] Implementa cambio de contraseña
- [ ] Implementa recuperación de contraseña
- [ ] Agrega logging de accesos
- [ ] Configura rate limiting más estricto
