# QUICK START - Deploy DermaClinic a Railway

## 3 Pasos Simples

### 1️⃣ Compilar Frontend
```powershell
cd frontend
npm run build:local
cd ..
```

### 2️⃣ Preparar Git
```powershell
git init
git add .
git commit -m "DermaClinic initial commit"
```

### 3️⃣ Desplegar a Railway

**Opción A: Interfaz Web (Más Fácil)**
1. Ve a https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Conecta tu repositorio
4. Railway detecta `Procfile` automáticamente
5. ¡Listo! Se despliega en 2-3 minutos

**Opción B: Línea de Comandos**
```powershell
npm install -g railway
railway login
railway init
railway up
```

---

## Después del Despliegue

### Configurar Variables (IMPORTANTE)

En dashboard de Railway → Tu Proyecto → Variables:

```
# Ya está:
DATABASE_URL=postgresql://...  (automático)
NODE_ENV=production
DATABASE_MODE=cloud
PORT=3001
HOST=0.0.0.0

# AGREGUÉ ESTOS:
JWT_ACCESS_SECRET=tu-valor-secreto-aquí
JWT_REFRESH_SECRET=tu-otro-secreto-aquí
CORS_ORIGIN=https://tu-app.railway.app
```

**Generar secrets:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Crear Usuario Demo
```powershell
railway run npm run seed
```

O desde psql:
```bash
psql "tu-DATABASE_URL"
# Ejecutar el script SQL
```

---

## URLs

Tu aplicación estará en:
```
https://tu-proyecto.railway.app
```

Credenciales iniciales:
```
Email: demo@dermaclinic.com
Contraseña: password
```

---

## Archivos de Configuración Listos ✅

```
Procfile              ← Le dice a Railway cómo iniciar tu app
railway.json          ← Configuración de Railway
.env.example          ← Variables de ejemplo
DEPLOYMENT_RAILWAY.md ← Guía completa
```

---

## Más Info

📖 [DEPLOYMENT_RAILWAY.md](DEPLOYMENT_RAILWAY.md) - Guía completa con troubleshooting
