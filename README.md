# 🌸 DermaClinic — Sistema de Gestión Dermatológica

Sistema web de gestión de historia clínica para centro de dermatología.  
Accesible desde cualquier navegador en la red local del consultorio.

---

## 📋 Requisitos previos

Instalar **Node.js LTS** desde: https://nodejs.org  
(Versión 18 o superior. Solo se instala una vez en la PC servidora.)

---

## 🚀 Instalación (primera vez)

### En Windows:
1. Descomprimí la carpeta `dermaclinic` en cualquier lugar (ej: `C:\DermaClinic`)
2. Hacé doble clic en **`INSTALAR_Y_ARRANCAR.bat`**
3. Esperá que instale todo (puede tardar 2-3 minutos)
4. Cuando aparezca `Servidor corriendo en: http://0.0.0.0:3001`, ¡listo!

### En Mac/Linux:
```bash
cd dermaclinic
cd backend && npm install && cd ..
cd frontend && npm install && npm run build:local && cd ..
cp -r frontend/build backend/frontend
cd backend && node src/server.js
```

---

## 💻 Uso diario (después de instalar)

1. Doble clic en **`ARRANCAR_SERVIDOR.bat`** en la PC servidora
2. Abrir el navegador en **cualquier PC de la red** y entrar a:
   - PC servidora: `http://localhost:3001`
   - Otras PCs: `http://[IP-DE-LA-PC-SERVIDORA]:3001`

### ¿Cómo saber la IP de la PC servidora?
```
Windows: Abrí CMD y ejecutá: ipconfig
         Buscá "Dirección IPv4" → ejemplo: 192.168.1.50
```
→ Las otras PCs acceden entrando a: `http://192.168.1.50:3001`

---

## 🗂 Estructura del proyecto

```
dermaclinic/
├── INSTALAR_Y_ARRANCAR.bat    ← Primera instalación
├── ARRANCAR_SERVIDOR.bat      ← Uso diario
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js          ← Servidor Express
│   │   ├── database.js        ← Configuración SQLite
│   │   └── routes/
│   │       ├── pacientes.js   ← API pacientes
│   │       └── sesiones.js    ← API sesiones
│   └── data/
│       └── dermaclinic.db     ← Base de datos (se crea automáticamente)
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js             ← Aplicación React
        └── api.js             ← Cliente HTTP
```

---

## 💾 Base de datos

Los datos se guardan en: `backend/data/dermaclinic.db`

**⚠️ Importante — Backup:**  
Copiá regularmente el archivo `dermaclinic.db` a un pendrive o carpeta compartida como respaldo.

---

## 🌐 API REST disponible

| Método | Ruta                    | Descripción              |
|--------|-------------------------|--------------------------|
| GET    | /api/pacientes          | Listar todas             |
| GET    | /api/pacientes?q=texto  | Buscar                   |
| GET    | /api/pacientes/:id      | Ver ficha + sesiones     |
| POST   | /api/pacientes          | Crear paciente           |
| PUT    | /api/pacientes/:id      | Editar paciente          |
| DELETE | /api/pacientes/:id      | Eliminar paciente        |
| POST   | /api/sesiones           | Crear sesión             |
| PUT    | /api/sesiones/:id       | Editar sesión            |
| DELETE | /api/sesiones/:id       | Eliminar sesión          |

---

## ❓ Solución de problemas

**El servidor no arranca:**
- Verificar que Node.js esté instalado: `node --version`
- Verificar que el puerto 3001 no esté ocupado

**Las otras PCs no pueden conectarse:**
- Verificar que están en la misma red WiFi/LAN
- Verificar que el firewall de Windows permite conexiones al puerto 3001:
  - Panel de control → Firewall → Reglas de entrada → Nueva regla → Puerto 3001

**Se perdieron los datos:**
- Los datos están en `backend/data/dermaclinic.db`
- Restaurar el archivo desde el último backup

---

## 📞 Tecnologías utilizadas

- **Frontend:** React 18, CSS-in-JS
- **Backend:** Node.js, Express
- **Base de datos:** SQLite (via better-sqlite3)
- **Comunicación:** API REST JSON

---

*DermaClinic v1.0 — Sistema de uso interno*
