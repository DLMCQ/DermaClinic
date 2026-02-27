# 🎯 Railway Deploy - Cheat Sheet

## ⚡ Comandos Rápidos

```bash
# ANTES DE RAILWAY

# 1. Compilar frontend
cd frontend && npm run build:local && cd ..

# 2. Git setup
git init
git add .
git commit -m "Deploy to Railway"

# 3. GitHub (opcional pero recomendado)
git remote add origin https://github.com/YO/dermaclinic.git
git push -u origin main


# EN RAILWAY DASHBOARD

# 4. New Project → Deploy from GitHub
# (o usar CLI)


# 5. Agregar variables mediante Dashboard UI
NODE_ENV=production
DATABASE_MODE=cloud
JWT_ACCESS_SECRET=<GENERAR>
JWT_REFRESH_SECRET=<GENERAR>
CORS_ORIGIN=https://tu-app.railway.app


# GENERAR SECRETS (PowerShell)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"


# DESPUÉS (en Railway)
railway run npm run seed


# VER LOGS
railway logs
railway logs --tail


# ABRIR EN NAVEGADOR
https://tu-proyecto.railway.app

Email: demo@dermaclinic.com
Password: password
```

---

## 📁 Archivos Criticos

```
Procfile          ← Sin extensión, le dice cómo iniciar
railway.json      ← Configuración avanzada
.env.example      ← Variable de ejemplo
```

---

## 🔑 Variables Necesarias

| Nombre | Valor | Generar |
|--------|-------|---------|
| NODE_ENV | `production` | - |
| DATABASE_MODE | `cloud` | - |
| HOST | `0.0.0.0` | - |
| DATABASE_URL | Automático | No |
| JWT_ACCESS_SECRET | **GENERAR** | ✅ |
| JWT_REFRESH_SECRET | **GENERAR** | ✅ |
| CORS_ORIGIN | `https://app.railway.app` | No |

---

## 🚨 Errores Comunes

| Error | Solución |
|-------|----------|
| "Procfile not found" | Verifica que existe en raíz (sin .txt) |
| "No token provided" | Ejecutar: `railway run npm run seed` |
| "Database connection failed" | Ver variable DATABASE_URL en Railway |
| "CORS error" | CORS_ORIGIN debe ser HTTPS y tu dominio |

---

## 📞 Comandos Railway CLI

```bash
railway login              # Conectar cuenta
railway init              # Inicializar proyecto
railway up                # Deploy
railway logs              # Ver logs históricos
railway logs --tail       # Ver logs en tiempo real
railway status            # Ver estado
railway open              # Abrir en navegador
railway run npm run seed  # Ejecutar comando
railway list              # Ver proyectos
```

---

## ✅ Deploy Checklist

- [ ] Frontend compilado
- [ ] Git inicializado
- [ ] GitHub conectado
- [ ] Proyecto creado en Railway
- [ ] Variables configuradas
- [ ] DATABASE_URL presente (automático)
- [ ] Usuario demo creado (`railway run npm run seed`)
- [ ] Puedo acceder a tu-app.railway.app
- [ ] Login funciona

---

## 🌐 Tu URL será

```
https://tu-proyecto-random.railway.app
```

O si configuras dominio custom:
```
https://tu-dominio.com
```

---

## 📖 Documentos Disponibles

- `PASOS_A_EJECUTAR.md` - **EMPIEZA AQUÍ** ← Click
- `RAILWAY_QUICK_START.md` - 3 pasos
- `DEPLOYMENT_RAILWAY.md` - Guía completa
- `RAILWAY_ENV_VARS.md` - Detalles variables
- `README_RAILWAY.md` - Este documento

---

**¿Necesitas más detalle? Abre `PASOS_A_EJECUTAR.md`**
