# Implementación: Envío de Ficha por Email

Permite enviar la historia clínica de una paciente como PDF adjunto directamente desde la app.

---

## Arquitectura

```
Frontend                          Backend                        Gmail SMTP
[Botón "Enviar ficha"] ──────► POST /api/pacientes/:id/enviar-ficha
                                  │
                                  ├─ Fetch paciente + sesiones (DB)
                                  ├─ Genera HTML de la ficha
                                  ├─ html-pdf-node → PDF buffer
                                  └─ nodemailer → email con PDF adjunto ──► Paciente
```

---

## 1. Configuración de Gmail

Requiere una **App Password** de Google (no la contraseña normal de la cuenta).

**Pasos:**
1. Activar verificación en 2 pasos en [myaccount.google.com/security](https://myaccount.google.com/security)
2. Ir a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Crear una App Password con nombre "DermaClinic"
4. Copiar la clave generada (formato: `xxxx xxxx xxxx xxxx`)

**Variables de entorno** — agregar al `.env` del backend:

```env
EMAIL_USER=dermaclinic@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=Centro DermaClinic <dermaclinic@gmail.com>
```

> En Railway, agregar estas mismas variables en el panel de **Variables** del proyecto.

---

## 2. Instalación de paquetes (backend)

```bash
cd backend
npm install nodemailer html-pdf-node
```

| Paquete | Rol |
|---------|-----|
| `nodemailer` | Envía el email vía Gmail SMTP |
| `html-pdf-node` | Convierte HTML a PDF buffer usando Chromium headless |

> **Nota Railway:** `html-pdf-node` descarga Chromium al deployar (~170MB). El primer deploy es más lento pero funciona correctamente.

---

## 3. Nuevo archivo: `backend/src/utils/mailer.js`

```js
const nodemailer = require('nodemailer');
const htmlPdf = require('html-pdf-node');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendFicha(toEmail, patientName, htmlContent) {
  const file = { content: htmlContent };
  const pdfBuffer = await htmlPdf.generatePdf(file, { format: 'A4' });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Tu historia clínica - Centro DermaClinic`,
    text: `Hola ${patientName}, adjuntamos tu historia clínica actualizada.`,
    attachments: [
      {
        filename: `ficha-${patientName.replace(/ /g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

module.exports = { sendFicha };
```

---

## 4. Nueva ruta en `backend/src/routes/pacientes.js`

Agregar antes del `module.exports`:

```js
const { sendFicha } = require('../utils/mailer');
const { buildPdfHtml } = require('../utils/pdfTemplate'); // ver punto 5

router.post('/:id/enviar-ficha', authIfCloud, async (req, res, next) => {
  try {
    const db = getDb();
    const placeholder = config.isLocal ? '?' : '$1';

    const paciente = await db.queryOne(
      `SELECT * FROM pacientes WHERE id = ${placeholder}`,
      [req.params.id]
    );

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrada' });
    }

    if (!paciente.email) {
      return res.status(400).json({ error: 'La paciente no tiene email registrado' });
    }

    const sesiones = await db.query(
      config.isLocal
        ? 'SELECT * FROM sesiones WHERE paciente_id = ? ORDER BY fecha DESC'
        : 'SELECT * FROM sesiones WHERE paciente_id = $1 ORDER BY fecha DESC',
      [req.params.id]
    );

    const htmlContent = buildPdfHtml({ ...paciente, sesiones });
    await sendFicha(paciente.email, paciente.nombre, htmlContent);

    res.json({ ok: true, message: `Ficha enviada a ${paciente.email}` });
  } catch (err) {
    next(err);
  }
});
```

---

## 5. Nuevo archivo: `backend/src/utils/pdfTemplate.js`

Replica el HTML template que ya existe en `frontend/src/utils/helpers.js`, adaptado para Node.js (sin `window`, sin `formatDate` de React).

```js
function formatDate(s) {
  if (!s) return '';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const b = new Date(dob);
  let age = today.getFullYear() - b.getFullYear();
  const mo = today.getMonth() - b.getMonth();
  if (mo < 0 || (mo === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

function buildPdfHtml(patient) {
  const sesiones = [...patient.sesiones]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((s) => `
      <div style="page-break-inside:avoid;margin-bottom:22px;border:1px solid #ddd;border-radius:8px;padding:18px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <h3 style="margin:0;color:#8b5e3c;font-size:15px;">${s.tratamiento}</h3>
          <span style="color:#888;font-size:13px;">${formatDate(s.fecha)}</span>
        </div>
        ${s.productos ? `<p style="margin:5px 0;font-size:13px;"><strong>Productos:</strong> ${s.productos}</p>` : ''}
        ${s.notas ? `<p style="margin:5px 0;font-size:13px;"><strong>Notas:</strong> ${s.notas}</p>` : ''}
        ${s.imagen_antes || s.imagen_despues ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
            ${s.imagen_antes ? `<div><p style="font-size:11px;color:#888;margin:0 0 5px;text-transform:uppercase;letter-spacing:1px;">ANTES</p><img src="${s.imagen_antes}" style="width:100%;border-radius:6px;max-height:180px;object-fit:cover;"/></div>` : ''}
            ${s.imagen_despues ? `<div><p style="font-size:11px;color:#888;margin:0 0 5px;text-transform:uppercase;letter-spacing:1px;">DESPUÉS</p><img src="${s.imagen_despues}" style="width:100%;border-radius:6px;max-height:180px;object-fit:cover;"/></div>` : ''}
          </div>` : ''}
      </div>
    `)
    .join('');

  const initials = patient.nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>Ficha - ${patient.nombre}</title>
    <style>
      body{font-family:Georgia,serif;margin:0;padding:30px;color:#333;font-size:14px;}
      .header{display:flex;align-items:center;gap:20px;padding-bottom:20px;border-bottom:3px solid #c9a96e;margin-bottom:24px;}
      .foto{width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #c9a96e;flex-shrink:0;}
      .foto-ph{width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#c9a96e,#8b5e3c);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:white;flex-shrink:0;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;}
      .fl{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
      .fv{font-size:14px;color:#333;font-weight:500;}
      h2{color:#8b5e3c;font-size:17px;margin:22px 0 12px;border-bottom:1px solid #eee;padding-bottom:6px;}
    </style></head><body>
    <div class="header">
      ${patient.foto_url ? `<img src="${patient.foto_url}" class="foto"/>` : `<div class="foto-ph">${initials}</div>`}
      <div style="flex:1">
        <div style="font-size:22px;font-weight:bold;color:#8b5e3c;">Centro Dermatológico</div>
        <div style="color:#a07848;font-size:13px;">Historia Clínica del Paciente</div>
      </div>
      <div style="text-align:right;color:#aaa;font-size:11px;">Generado: ${new Date().toLocaleDateString('es-AR')}</div>
    </div>
    <h2>Datos Personales</h2>
    <div class="grid">
      <div><div class="fl">Nombre completo</div><div class="fv">${patient.nombre}</div></div>
      <div><div class="fl">DNI</div><div class="fv">${patient.dni}</div></div>
      ${patient.fecha_nacimiento ? `<div><div class="fl">Fecha de nacimiento</div><div class="fv">${formatDate(patient.fecha_nacimiento)} (${calcAge(patient.fecha_nacimiento)} años)</div></div>` : ''}
      ${patient.telefono ? `<div><div class="fl">Teléfono</div><div class="fv">${patient.telefono}</div></div>` : ''}
      ${patient.email ? `<div><div class="fl">Email</div><div class="fv">${patient.email}</div></div>` : ''}
      ${patient.direccion ? `<div><div class="fl">Dirección</div><div class="fv">${patient.direccion}</div></div>` : ''}
      ${patient.obra_social ? `<div><div class="fl">Obra Social</div><div class="fv">${patient.obra_social}</div></div>` : ''}
      ${patient.nro_afiliado ? `<div><div class="fl">Nro. Afiliado</div><div class="fv">${patient.nro_afiliado}</div></div>` : ''}
    </div>
    ${patient.motivo_consulta ? `<div style="margin-top:14px;padding:12px 16px;background:#fdf8f3;border-radius:8px;border-left:3px solid #c9a96e;"><div class="fl">Motivo de consulta / Antecedentes</div><div class="fv" style="margin-top:4px;">${patient.motivo_consulta}</div></div>` : ''}
    <h2>Historial de Sesiones (${patient.sesiones.length})</h2>
    ${patient.sesiones.length > 0 ? sesiones : '<p style="color:#aaa;font-style:italic;">Sin sesiones registradas.</p>'}
    <div style="margin-top:40px;padding-top:14px;border-top:1px solid #eee;text-align:center;color:#bbb;font-size:11px;">
      Sistema de Gestión DermaClinic · ${new Date().toLocaleString('es-AR')}
    </div>
  </body></html>`;
}

module.exports = { buildPdfHtml };
```

---

## 6. Cambios en el frontend (`PatientsPage.jsx`)

### Estado nuevo
```jsx
const [sending, setSending] = useState(false);
```

### Función handler
```jsx
async function handleSendEmail(patient) {
  if (!patient?.email) return;
  setSending(true);
  try {
    await api.post(`/pacientes/${patient.id}/enviar-ficha`);
    showToast(`Ficha enviada a ${patient.email}`, 'success');
  } catch (err) {
    showToast(err.message || 'Error al enviar el email', 'error');
  } finally {
    setSending(false);
  }
}
```

### Botón (junto al botón "Exportar PDF" existente)
```jsx
<Btn
  variant="ghost"
  onClick={() => handleSendEmail(selectedPatient)}
  disabled={!selectedPatient?.email || sending}
  title={!selectedPatient?.email ? 'La paciente no tiene email registrado' : ''}
>
  {sending ? 'Enviando...' : 'Enviar ficha por email'}
</Btn>
```

---

## 7. Registro de la ruta en `server.js`

No requiere cambios — la nueva ruta `POST /:id/enviar-ficha` se agrega dentro del router de pacientes que ya está montado en `/api/pacientes`.

---

## Resumen de archivos modificados / creados

| Archivo | Acción |
|---------|--------|
| `backend/.env` | Agregar 3 variables de email |
| `backend/src/utils/mailer.js` | **Crear** — transporte nodemailer + función sendFicha |
| `backend/src/utils/pdfTemplate.js` | **Crear** — template HTML de la ficha (port del frontend) |
| `backend/src/routes/pacientes.js` | **Modificar** — agregar ruta POST `/:id/enviar-ficha` |
| `frontend/src/pages/PatientsPage.jsx` | **Modificar** — agregar estado, handler y botón |

---

## Límites y consideraciones

| Tema | Detalle |
|------|---------|
| Gmail gratuito | 500 emails/día — suficiente para uso clínico |
| Paciente sin email | Botón deshabilitado automáticamente |
| Imágenes Base64 | Se incluyen en el HTML y el PDF las renderiza correctamente |
| Railway deploy | Primer deploy más lento por descarga de Chromium (~170MB) |
| Alternativa sin Chromium | Reemplazar `html-pdf-node` por **Resend** (acepta HTML, genera PDF en la nube) |
