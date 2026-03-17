# Seguridades a Implementar

Revisión de vulnerabilidades detectadas en el código actual. Ordenadas por prioridad.

---

## 1. Endpoint de debug público (URGENTE)

**Archivo:** `backend/src/server.js` — ruta `/api/debug/tables`

El endpoint devuelve el contenido completo de las tablas `users`, `pacientes` y `sesiones` sin ningún tipo de autenticación. Está activo en producción.

**Fix:** Eliminar el bloque completo. Si se necesita para desarrollo, envolverlo en un guard de entorno y protegerlo con autenticación de admin.

---

## 2. Contraseñas en texto plano

**Archivos:** `backend/src/routes/auth.js`, `backend/src/routes/users.js`, `backend/src/seed.js`

Las contraseñas se almacenan y comparan sin hashear. El módulo `backend/src/utils/password.js` con bcrypt ya está implementado pero nunca se usa.

**Fix:**
- Importar `hashPassword` y `comparePassword` de `password.js`
- Usarlos en el login (comparación), en la creación/actualización de usuarios (hash antes de guardar), y en el seed
- Correr una migración única para hashear las contraseñas existentes en la DB

---

## 3. JWT secrets sin validación de arranque

**Archivo:** `backend/src/config/index.js`

Si las variables de entorno `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` no están definidas, la aplicación usa valores de fallback conocidos (visibles en el código fuente). No hay nada que impida que el servidor arranque en producción con esos defaults.

**Fix:** Agregar validación al inicio del proceso que lance un error fatal si las variables no están definidas en producción:

```js
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET)  throw new Error('FATAL: JWT_ACCESS_SECRET no configurado');
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('FATAL: JWT_REFRESH_SECRET no configurado');
}
```

Verificar también que los secrets estén cargados en el panel de variables de entorno de Hostinger.

---

## 4. Refresh token no se rota

**Archivo:** `backend/src/routes/auth.js` — endpoint `/api/auth/refresh`

Al refrescar el access token, el refresh token usado queda válido en la base de datos durante toda su vida útil (7 días). Si un refresh token es robado, puede usarse indefinidamente sin que el sistema lo detecte.

**Fix:** Al procesar un refresh, eliminar el token usado e insertar uno nuevo. Devolver el nuevo refresh token en la respuesta junto con el access token.

---

## 5. Eliminación de imágenes sin verificación de pertenencia

**Archivo:** `backend/src/routes/images.js` — endpoint `DELETE /api/images/delete`

Cualquier usuario autenticado puede eliminar cualquier imagen de Cloudinary enviando su `public_id`, sin que el sistema verifique que esa imagen pertenece a un recurso al que el usuario tiene acceso.

**Fix:** Antes de llamar a `cloudinary.uploader.destroy()`, consultar la base de datos para confirmar que el `public_id` existe en la tabla `pacientes` o `sesiones`. Si no se encuentra, rechazar la solicitud con 404.

---

## Estado

| # | Descripción | Estado |
|---|-------------|--------|
| 1 | Endpoint debug público | Pendiente |
| 2 | Contraseñas en texto plano | Pendiente |
| 3 | JWT secrets sin validación | Pendiente |
| 4 | Refresh token sin rotación | Pendiente |
| 5 | Eliminación de imágenes sin ownership | Pendiente |
