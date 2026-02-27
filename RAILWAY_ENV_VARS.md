# Railway Environment Setup - DermaClinic

Esta es la configuración que debes usar en Railway Dashboard → Variables

## Variables Requeridas

Copia estas variables en Railway:

### Obtenidas Automáticamente por Railway
```
DATABASE_URL=<Se completa automáticamente desde PostgreSQL>
```

### Variables que DEBES Configurar

```
NODE_ENV=production
DATABASE_MODE=cloud
HOST=0.0.0.0
```

### JWT Secrets (GENERA NUEVOS)

Abre PowerShell y ejecuta 2 veces:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Luego copia los valores:
```
JWT_ACCESS_SECRET=<primer-valor-generado>
JWT_REFRESH_SECRET=<segundo-valor-generado>
```

### CORS Origin (basado en tu dominio)

Cuando Railway asigne tu dominio (ej: dermaclinic-prod.railway.app):
```
CORS_ORIGIN=https://dermaclinic-prod.railway.app
```

O puedes dejar:
```
CORS_ORIGIN=*
```

(Menos seguro, pero válido para desarrollo)

### Opcional - Email / Variables Adicionales

Si quieres agregar más tarde:
```
LOG_LEVEL=info
BACKUP_ENABLED=false
```

---

## Cómo Agregarlo en Railway

1. Login en https://railway.app
2. Click en tu proyecto
3. Tab "Variables"
4. Click "Add Variable"
5. Ingresa cada línea:
   - **Name**: `NODE_ENV`
   - **Value**: `production`
6. Click "Add"
7. Repetir para cada variable

O agregar en bloques:
```
NODE_ENV=production
DATABASE_MODE=cloud
HOST=0.0.0.0
JWT_ACCESS_SECRET=<tu-valor>
JWT_REFRESH_SECRET=<tu-valor>
CORS_ORIGIN=https://tu-dominio.railway.app
```

---

## Verificar Configuración

En Railway Dashboard:
1. Click "Redis" o "PostgreSQL" de tu proyecto
2. Verifica que `DATABASE_URL` existe

```
DATABASE_URL=postgresql://user:pass@host:port/db
```

Si no la ves, Railway la proporciona automáticamente al vincular con PostgreSQL.

---

## Después: Crear Usuario Demo

Una vez que todo está deployado:

```powershell
railway run npm run seed
```

O via psql:
```bash
psql "postgresql://..."
# Luego ejecuta INSERT para crear usuario
```

---

## Testing Post-Deploy

```powershell
# Ver logs
railway logs

# Ver estado
railway status

# Abrir app en navegador
railway open

# Generar variable de entorno (usar en scripts)
railway link
```

---

## Troubleshooting

### DATABASE_URL no aparece
- [ ] ¿PostgreSQL está linkado? (Railway → Plugins)
- [ ] ¿PostgreSQL está running? (Check status)
- [ ] Redeploy después de agregar PostgreSQL

### "No token provided"
- [ ] JWT_ACCESS_SECRET está configurado
- [ ] NODE_ENV=production
- [ ] Usuario demo creado (`railway run npm run seed`)

### CORS error
- [ ] CORS_ORIGIN está correcta
- [ ] Frontend está compilado (`npm run build:local`)
- [ ] Redeploy después de cambiar CORS_ORIGIN

---

## Deploy Check List

- [ ] NODE.js detectado en Railway
- [ ] PostgreSQL conectada
- [ ] DATABASE_URL presente
- [ ] JWT_ACCESS_SECRET configurado
- [ ] JWT_REFRESH_SECRET configurado
- [ ] CORS_ORIGIN configurado
- [ ] Procfile leído por Railway
- [ ] npm start ejecutándose
- [ ] Migraciones completadas (ver logs)
- [ ] Usuario demo creado
- [ ] Login funciona
- [ ] CRUD funciona

---

## Command References

```bash
# Login
railway login

# Inicializar proyecto
railway init

# Deploy
railway up

# Ver logs en tiempo real
railway logs --tail

# Ver status
railway status

# Ejecutar comando en Railway
railway run npm run seed

# Abrir dashboard
railway open

# Linkear proyecto local
railway link

# Desconectar login
railway logout
```

¡Listo! Cualquier duda revisa [DEPLOYMENT_RAILWAY.md](DEPLOYMENT_RAILWAY.md)
