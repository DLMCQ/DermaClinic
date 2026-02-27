# DermaClinic + Railway - Pasos Exactos ✅

**TODO está listo. Estos son los pasos que DEBES ejecutar:**

---

## PASO 1: Compilar Frontend (5 min)

```powershell
cd "c:\Users\majac\Documents\Chamba\DermaClinic\DermaClinic\frontend"
npm run build:local
```

**Resultado esperado:**
```
✓ Build succeeds
✓ You can serve it with a static server
```

---

## PASO 2: Preparar Git (2 min)

Desde el directorio raíz (`DermaClinic/`):

```powershell
cd "c:\Users\majac\Documents\Chamba\DermaClinic\DermaClinic"
git init
git add .
git commit -m "DermaClinic - listo para Railway"
```

**Resultado esperado:**
```
[main (root-commit)] DermaClinic - listo para Railway
 X files changed
```

---

## PASO 3: Conectar a GitHub (2 min) - RECOMENDADO

Esta parte es **opcional pero RECOMENDADA** para auto-deploy.

### 3.1 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `dermaclinic`
3. Descripción: `DermaClinic - Sistema de Gestión Dermatológica`
4. Private (recomendado)
5. Create

### 3.2 Conectar tu local a GitHub

```powershell
git remote add origin https://github.com/TU_USUARIO/dermaclinic.git
git branch -M main
git push -u origin main
```

**Resultado esperado:**
```
Enumerating objects: ...
Counting objects: ...
To https://github.com/TU_USUARIO/dermaclinic.git
 * [new branch]      main -> main
```

---

## PASO 4: Desplegar a Railway (10-15 min)

### OPCIÓN A: Interfaz Web (Más Fácil) ✅ RECOMENDADO

1. **Abre Railway:**
   - Ve a https://railway.app
   - Login con GitHub (recomendado)

2. **Crear Proyecto:**
   - Click "New Project"
   - Click "Deploy from GitHub"
   - Selecciona tu repositorio `dermaclinic`
   - Click "Deploy"

3. **Espera 2-3 minutos (Railway hace todo automáticamente)**
   - Detecta Procfile
   - Instala dependencias
   - Compila frontend
   - Inicia servidor

4. **¡Listo!**
   - Railway te muestra la URL: `https://xyz123.railway.app`

### OPCIÓN B: Línea de comandos (Si prefieres CLI)

```powershell
npm install -g railway
railway login
cd "c:\Users\majac\Documents\Chamba\DermaClinic\DermaClinic"
railway init
railway up
```

---

## PASO 5: Configurar Variables de Entorno (5 min) - CRÍTICO

**Esto es IMPORTANTE que hagas:**

### 5.1 Genera dos valores aleatorios (secretos)

En PowerShell (ejecuta DOS VECES):

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia los dos valores obtenidos.

### 5.2 Ve a Railway Dashboard

1. https://railway.app
2. Click tu proyecto → "Variables"
3. Click "Add Variable"

Agrega estas variables (una por una):

| NAME | VALUE |
|------|-------|
| NODE_ENV | `production` |
| DATABASE_MODE | `cloud` |
| HOST | `0.0.0.0` |
| JWT_ACCESS_SECRET | `<valor-1-que-generaste>` |
| JWT_REFRESH_SECRET | `<valor-2-que-generaste>` |
| CORS_ORIGIN | `https://tu-proyecto.railway.app` |

**Nota:** `DATABASE_URL` aparecerá automáticamente si PostgreSQL está vinculada.

### 5.3 Verificar DATABASE_URL

En Railway → Variables, verifica que existe:
```
DATABASE_URL=postgresql://user:pass@host:5432/railway
```

Si NO aparece:
1. Railway → tu proyecto → "Plugins"
2. Verifica que PostgreSQL está agregado
3. Refresca la página

---

## PASO 6: Crear Usuario Demo (2 min)

En PowerShell:

```powershell
# Método 1: CLI de Railway (más fácil)
railway run npm run seed

# O Método 2: psql directo (solo si sabes)
psql "postgresql://user:pass@host:5432/railway"
```

**Resultado esperado:**
```
✅ Demo user created successfully
   Email: demo@dermaclinic.com
   Password: password
```

---

## PASO 7: ¡Acceder! 🎉

Abre en tu navegador:

```
https://tu-proyecto.railway.app
```

**Login con:**
```
Email: demo@dermaclinic.com
Contraseña: password
```

---

## ✅ Checklist Final

Antes de decir "está listo":

- [ ] Compilé frontend (`npm run build:local`)
- [ ] Git preparado (`git init`, `git add`, `git commit`)
- [ ] GitHub conectado (push origin main) - *Opcional*
- [ ] Desplegado en Railway (Procfile detectado)
- [ ] Variables de entorno configuradas
- [ ] DATABASE_URL aparece en Railway
- [ ] Usuario demo creado (`railway run npm run seed`)
- [ ] Puedo acceder a https://tu-proyecto.railway.app
- [ ] Login funciona
- [ ] Veo lista de pacientes vacía

---

## 🆘 Si Algo Falla

### "Procfile not found"
- Verifica que `Procfile` (sin extensión) está en raíz
- Sin extensión `.txt`

### "Database connection failed"
- Verifica que PostgreSQL está en Railway → Plugins
- Verifica que DATABASE_URL existe en Variables
- Redeploy: Railway → Deploy → Redeploy latest

### "No token provided"
- Ejecuta: `railway run npm run seed`
- Verifica JWT_ACCESS_SECRET está configurado

### Ver qué pasó
```powershell
railway logs
railway logs --tail  # Ver en tiempo real
```

---

## 📖 Documentación Extra

Si necesitas más info:

1. **[RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md)** - Resumen 1 página
2. **[DEPLOYMENT_RAILWAY.md](DEPLOYMENT_RAILWAY.md)** - Guía completa + troubleshooting
3. **[RAILWAY_ENV_VARS.md](RAILWAY_ENV_VARS.md)** - Detalle de cada variable
4. **[RAILWAY_SETUP_SUMMARY.md](RAILWAY_SETUP_SUMMARY.md)** - Diagrama y estado

---

## 🎯 ¿Dónde Estamos?

```
✅ Todo el código está listo
✅ Procfile configurado
✅ JWT implementado
✅ Base de datos PostgreSQL existe
✅ Usuario demo se crea automáticamente

🔜 AHORA: Ejecuta los 7 pasos arriba
```

---

**¿Necesitas ayuda? Revisa el troubleshooting en [DEPLOYMENT_RAILWAY.md](DEPLOYMENT_RAILWAY.md)**

Adelante! 🚀
