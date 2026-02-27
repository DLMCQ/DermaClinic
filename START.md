# 🌸 DermaClinic - EMPEZAR AQUÍ

## 🚀 Opción 1: Desplegar en RAILWAY (Recomendado)

Tu aplicación está **100% lista** para Railway.

**Tiempo:** 30 minutos

**Sigue esto:** [`PASOS_A_EJECUTAR.md`](PASOS_A_EJECUTAR.md)

Resultado: `https://tu-app.railway.app` ✅

---

## 🏠 Opción 2: Ejecutar Localmente

Para usar en tu PC/red local.

**Ejecutar:**

```powershell
cd backend
npm install
npm start
```

Luego abre: `http://localhost:3001`

---

## 📚 Documentación

### Para Railway (NUEVO)

- [`PASOS_A_EJECUTAR.md`](PASOS_A_EJECUTAR.md) ← **Empieza aquí**
- [`RAILWAY_QUICK_START.md`](RAILWAY_QUICK_START.md) - Resumen 1 página
- [`RAILWAY_CHEATSHEET.md`](RAILWAY_CHEATSHEET.md) - Comandos rápidos
- [`DEPLOYMENT_RAILWAY.md`](DEPLOYMENT_RAILWAY.md) - Guía completa
- [`DOCUMENTACION_INDICE.md`](DOCUMENTACION_INDICE.md) - Índice completo

### Para Acceso Remoto

- [`ACCESO_REMOTO.md`](ACCESO_REMOTO.md) - Ngrok, Port Forwarding, etc.

### Para Autenticación

- [`SETUP_AUTENTICACION.md`](SETUP_AUTENTICACION.md) - JWT, Login, etc.

### Original

- [`README.md`](README.md) - Documentación completa original

---

## ⚡ Quick Start - Opción Railway (5 min)

```bash
# 1. Compilar frontend (ya hecho, pero por si acaso)
cd frontend && npm run build:local && cd ..

# 2. Git
git init && git add . && git commit -m "Deploy"

# 3. Railway
# - Abre https://railway.app
# - Deploy from GitHub
# - Agrega variables JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 4. Crear usuario demo
railway run npm run seed

# 5. ¡Acceder!
https://tu-proyecto.railway.app
demo@dermaclinic.com / password
```

---

## 💡 ¿Qué es DermaClinic?

Sistema de gestión para dermatología con:
- 📋 Historias clínicas
- 👥 Gestión de pacientes
- 📸 Fotos antes/después
- 🏥 Sesiones de tratamiento
- 📊 Estadísticas
- 🔐 Autenticación JWT
- ☁️ Disponible en cloud (Railway)

---

## 👤 Credenciales Iniciales

```
Email: demo@dermaclinic.com
Contraseña: password
```

Cambiar después en producción.

---

## 📖 La Decisión Es Tuya

```
┌─ ¿Railway? (Aconsejado)
│  └─ Abre: PASOS_A_EJECUTAR.md
│
└─ ¿Local? (Para testing)
   └─ Ejecuta: npm install && npm start
```

---

**Adelante! 🚀**

Cualquier duda: Lee `DOCUMENTACION_INDICE.md`
