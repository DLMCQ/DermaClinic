# Acceso desde Otra Red - DermaClinic

## Opciones para Acceder desde Otra Red

Tu servidor está en `localhost:3001` que solo es accesible dentro de tu red local. Para acceder desde otra red (diferente WiFi, celular 4G, etc), tienes varias opciones:

---

## Opción 1: NGROK (Más Fácil ✅ RECOMENDADO)

**ngrok** crea un túnel seguro entre tu servidor local e internet.

### Paso 1: Descargar ngrok
1. Ve a https://ngrok.com/download
2. Descarga e instala en tu PC

### Paso 2: Conectar ngrok a tu servidor
En una **nueva terminal PowerShell**:

```powershell
ngrok http 3001
```

### Resultado
Verás algo como:
```
Session Status                online
Version                       3.3.5
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123-456.ngrok.io → http://localhost:3001
```

### Acceso Remoto
Comparte esta URL: **https://abc123-456.ngrok.io**

Tus usuarios remotos pueden acceder desde cualquier dispositivo:
```
https://abc123-456.ngrok.io
```

Credenciales:
```
Email: demo@dermaclinic.com
Contraseña: password
```

### Ventajas:
- ✅ Funciona desde cualquier red
- ✅ No necesita configuración router
- ✅ Gratuito (versión básica)
- ✅ HTTPS incluido
- ✅ URL compartible

### Desventajas:
- ⚠️ URL cambia cada vez que reinicia
- ⚠️ Requiere conexión activa a ngrok

---

## Opción 2: Port Forwarding (Más Permanente)

Configura tu router para exponer el puerto 3001 a internet.

### Pasos:
1. Abre `http://192.168.1.1` (o la IP de tu router)
2. Busca "Port Forwarding"
3. Forward puerto externo `3001` a tu IP local `192.168.X.X:3001`
4. Obtén tu IP pública: https://www.whatismyipaddress.com
5. Compartir: `http://TU_IP_PUBLICA:3001`

### Ventajas:
- ✅ URL permanente
- ✅ Acceso 24/7

### Desventajas:
- ⚠️ Expone tu red a internet
- ⚠️ Requiere acceso router
- ⚠️ Riesgos de seguridad (implementa firewall)

---

## Opción 3: Desplegar en la Nube (Más Profesional)

Usa Railway, Heroku, o similar para desplegar permanentemente.

### Ejemplo con Railway:
1. Ve a https://railway.app
2. Conecta tu repositorio GitHub
3. Configura `DATABASE_URL` de PostgreSQL
4. Deploy automático

URL resultante: `https://dermaclinic-prod.railway.app`

### Ventajas:
- ✅ Profesional
- ✅ Permanente y confiable
- ✅ Escalable

### Desventajas:
- ⚠️ Requiere pago para uso continuo
- ⚠️ Más configuración

---

## Solución Rápida: Script con ngrok integrado

Si quieres automatizar ngrok, crea este archivo:

**`ARRANCAR_CON_REMOTE.bat`**

```batch
@echo off
echo.
echo ================================================
echo    DermaClinic - Servidor con Acceso Remoto
echo ================================================
echo.

REM Iniciar servidor backend en background
echo Iniciando servidor backend en puerto 3001...
start cmd /k "cd backend && npm start"

REM Esperar a que inicie
timeout /t 3 /nobreak

REM Iniciar ngrok
echo.
echo Iniciando ngrok (hace accesible por internet)...
echo.
start cmd /k "ngrok http 3001"

REM Información
echo.
echo URL REMOTA: Busca en la ventana ngrok "Forwarding" 
echo Ejemplo: https://abc123.ngrok.io
echo.
echo Credenciales:
echo   Email: demo@dermaclinic.com
echo   Contraseña: password
echo.
pause
```

Reemplaza `ARRANCAR_SERVIDOR.bat` con este cuando necesites acceso remoto.

---

## Checklist de Seguridad

Cuando expongas tu app a internet:

- [ ] Cambia credenciales demo
- [ ] Configura `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` únicos
- [ ] Establece `CORS_ORIGIN` a tu dominio específico (no `*`)
- [ ] Usa HTTPS (ngrok incluye, pero verifica en producción)
- [ ] Implementa rate limiting (ya configurado en backend)
- [ ] Habilita HTTPS en `.env`
- [ ] Monitorea accesos

---

## Recomendación

**Para desarrollo/pruebas:** Usa **NGROK** (opción 1)

**Para producción:** Usa **RAILWAY** (opción 3) o tu servidor en la nube

**Para red corporativa:** Usa **Port Forwarding** (opción 2) con firewall
