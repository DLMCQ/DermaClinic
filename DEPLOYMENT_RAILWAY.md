# Deployment en Railway - DermaClinic

## Configuración Actual
✅ Base de datos PostgreSQL: Desplegada en Railway
✅ Código fuente: Listo para Railway

## Pasos para Desplegar

### Paso 1: Preparar el Código

#### 1.1 Verificar que tienes Git instalado
```powershell
git --version
```

#### 1.2 Inicializar repositorio Git (si no está)
```powershell
cd "c:\Users\majac\Documents\Chamba\DermaClinic\DermaClinic"
git init
git add .
git commit -m "Initial commit - DermaClinic"
```

#### 1.3 Conectar a GitHub (si quieres auto-deploy)
```powershell
# 1. Crear repositorio en GitHub
# 2. Conectar:
git remote add origin https://github.com/TU_USUARIO/dermaclinic.git
git branch -M main
git push -u origin main
```

### Paso 2: Configurar Railway

#### 2.1 Acceder a Railroad.app
1. Ve a https://railway.app
2. Login con GitHub (Recomendado para auto-deploy)

#### 2.2 Crear Nuevo Proyecto
1. Click en "New Project"
2. Opción A: "Deploy from GitHub" (automático) 
   - Conectar tu repositorio
   - Railway detectará automáticamente el Procfile
3. Opción B: "Deploy from CLI" (manual)
   ```powershell
   npm install -g railway
   railway login
   railway init
   railway up
   ```

### Paso 3: Configurar Variables de Entorno

En el dashboard de Railway:

1. Click en tu proyecto → "Variables"
2. Agrega las variables:

```
NODE_ENV=production
DATABASE_MODE=cloud
PORT=3001
HOST=0.0.0.0

# Railway proporciona DATABASE_URL automáticamente
# Pero puedes dejarla igual

JWT_ACCESS_SECRET=<generar-nuevo-valor>
JWT_REFRESH_SECRET=<generar-nuevo-valor>

CORS_ORIGIN=https://tu-servicio.railway.app
```

#### Generar nuevos JWT Secrets:

En PowerShell o Node.js:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Ejecuta dos veces y copia los valores a `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`

### Paso 4: Conectar Base de Datos Existente

Ya tienes PostgreSQL en Railway. Railway vinculará automáticamente:

1. Railway detecta tu conexión PostgreSQL
2. Crea la variable `DATABASE_URL` automáticamente
3. Las migraciones corren al iniciar el servidor

#### Verificar conexión:
En el dashboard de Railway → Variables, verifica que `DATABASE_URL` esté presente.

### Paso 5: Crear Usuario Demo en Producción

Una vez deployado, ejecuta el seed en producción:

Opción A: Conectar a tu backend
```powershell
# Desde el dashboard de Railway, abre "Railway CLI"
railway run npm run seed
```

Opción B: Usar psql directamente
```bash
psql "tu-DATABASE_URL-aqui"
# Luego ejecuta el script de seed SQL
```

### Paso 6: Obtener Tu URL

Después del deployment:

1. En dashboard de Railway → Tu proyecto
2. Verás una URL como: `https://dermaclinic-prod.railway.app`
3. **Esa es tu aplicación en vivo** ✅

Accede:
```
https://dermaclinic-prod.railway.app
```

Login:
```
Email: demo@dermaclinic.com
Contraseña: password
```

---

## Configuración del Frontend para Railway

El frontend se sirve automáticamente desde el backend.

### Actualizar URL API (si es necesario):

El backend en `server.js` sirve el frontend compilado desde `/frontend/build`.

Verifica que el frontend está compilado:
```powershell
cd frontend
npm run build:local
```

### Resultado:
- Backend: `https://dermaclinic-prod.railway.app/api/*`
- Frontend: `https://dermaclinic-prod.railway.app/`
- Todo integrado en un solo deployment

---

## Archivo `Procfile` - Ya Creado ✅

Railway usa este archivo para saber cómo iniciar tu app:

```
web: cd backend && npm start
```

Sirve:
1. Backend en puerto 3001
2. Frontend estático desde `/build`

---

## Archivo `railway.json` - Ya Creado ✅

Configuración especifica de Railway:
- Define builder (nixpacks)
- Define comando de inicio
- Define reintentos

---

## Troubleshooting

### Error: "No token provided"
Verifica que:
- [ ] Usuario demo está creado (`railway run npm run seed`)
- [ ] JWT_ACCESS_SECRET está configurado
- [ ] Frontend está compilado (`npm run build:local`)

### Error: "Database connection failed"
- [ ] DATABASE_URL está correcta
- [ ] PostgreSQL en Railway está running
- [ ] Migraciones se ejecutaron

### Error: Port timeout
- [ ] Puerto 3001 está correcto en `.env`
- [ ] Railway asigna puerto automáticamente (ignora PORT=3001, usa su puerto)

### Ver logs en Rails
```powershell
railway logs
```

---

## Post-Deploy Checklist

- [ ] Base de datos conectada y migraciones OK
- [ ] Usuario demo creado
- [ ] Aplicación accessible en URL de Railway
- [ ] Login funciona
- [ ] CRUD de pacientes funciona
- [ ] Cambiar JWT_ACCESS_SECRET y JWT_REFRESH_SECRET
- [ ] Cambiar CORS_ORIGIN a tu dominio
- [ ] Cambiar credenciales demo
- [ ] Implementar HTTPS (Railway lo maneja)

---

## Costo

Free tier Railway (primeras 5 dólares/mes):
- ✅ Backend Node.js
- ✅ PostgreSQL
- ✅ Suficiente para dev/testing

Upgrade si necesitas más recursos.

---

## Para Auto-Deploy

Cada vez que hagas push a tu repositorio GitHub:
```powershell
git add .
git commit -m "Update DermaClinic"
git push origin main
```

Railway detecta cambios y despliega automáticamente (2-3 minutos).

---

## Referencia Railway

- Docs: https://docs.railway.app
- CLI Docs: https://docs.railway.app/develop/cli
- Community: https://railway.app/support
