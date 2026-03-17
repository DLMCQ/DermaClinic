# Mejoras de Seguridad JWT

Puntos pendientes a implementar en el sistema de autenticación.

---

## 1. HTTPS Forzado — Urgencia: Alta

### Por qué implementarlo
El sistema se usa en entornos clínicos con WiFi compartido. Sin HTTPS forzado, un atacante
en la misma red puede capturar tokens en texto plano con herramientas simples (Wireshark).
Con el token capturado puede hacerse pasar por un médico y acceder a datos de pacientes.

### Qué hacer
Verificar que Hostinger redirija automáticamente HTTP → HTTPS.
Si no lo hace, forzarlo desde el backend:

```js
// backend/src/server.js
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
});
```

---

## 2. Refresh Token Rotation — Urgencia: Media

### Por qué implementarlo
Actualmente el mismo refresh token se reutiliza durante 7 días. Si alguien lo roba
(por XSS, red comprometida, etc.), puede generar access tokens durante toda esa semana
sin que el usuario legítimo ni el sistema se enteren.

Con rotation, cada uso del refresh token genera uno nuevo e invalida el anterior.
Si el token robado se usa, el sistema detecta que el original ya fue rotado y fuerza logout.

### Qué hacer
En la ruta `/api/auth/refresh`:
1. Verificar el refresh token recibido
2. Eliminarlo de la tabla `refresh_tokens`
3. Generar un nuevo refresh token y guardarlo
4. Devolver el nuevo access token + nuevo refresh token

```js
// Lógica de rotation en /api/auth/refresh
const old = await db.queryOne('SELECT * FROM refresh_tokens WHERE token = ?', [token]);
if (!old) return res.status(401).json({ error: 'Token inválido' });

await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);

const newRefresh = generateRefreshToken();
await db.execute('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [...]);

res.json({ accessToken, refreshToken: newRefresh });
```

---

## 3. Blacklist de Tokens Revocados — Urgencia: Baja

### Por qué implementarlo
Al hacer logout, el access token sigue siendo válido hasta que expira (15 minutos).
Si alguien lo captura justo antes del logout, tiene una ventana de acceso.

Es el riesgo más bajo de los tres porque la ventana es corta (15 min) y requiere
que el atacante ya tenga el token previamente.

### Qué hacer
Crear una tabla `token_blacklist` y chequear en el middleware `auth.js`:

```sql
CREATE TABLE token_blacklist (
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (token)
);
```

```js
// En middleware/auth.js, después de verificar el token
const blocked = await db.queryOne('SELECT 1 FROM token_blacklist WHERE token = ?', [token]);
if (blocked) return res.status(401).json({ error: 'Token revocado' });
```

Al hacer logout, insertar el token en la blacklist hasta su fecha de expiración.
Limpiar registros expirados periódicamente.
