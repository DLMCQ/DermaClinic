const nodemailer = require('nodemailer');
const config = require('../config');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
}

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

function buildFichaHtml(patient) {
  const sesiones = [...patient.sesiones]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((s) => `
      <div style="page-break-inside:avoid;margin-bottom:22px;border:1px solid #c8d0db;border-radius:8px;padding:18px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <h3 style="margin:0;color:#1A989D;font-size:15px;">${s.tratamiento}</h3>
          <span style="color:#888;font-size:13px;">📅 ${formatDate(s.fecha)}</span>
        </div>
        ${s.productos ? `<p style="margin:5px 0;font-size:13px;"><strong>Productos:</strong> ${s.productos}</p>` : ''}
        ${s.notas ? `<p style="margin:5px 0;font-size:13px;"><strong>Notas:</strong> ${s.notas}</p>` : ''}
      </div>
    `)
    .join('');

  const initials = patient.nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const age = calcAge(patient.fecha_nacimiento);

  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>Ficha - ${patient.nombre}</title>
    <style>
      body{font-family:Georgia,serif;margin:0;padding:30px;color:#293647;font-size:14px;background:#fff;}
      .header{display:flex;align-items:center;gap:20px;padding-bottom:20px;border-bottom:3px solid #1A989D;margin-bottom:24px;}
      .foto{width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #1A989D;flex-shrink:0;}
      .foto-ph{width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#1A989D,#405570);display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:white;flex-shrink:0;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;}
      .fl{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;}
      .fv{font-size:14px;color:#293647;font-weight:500;}
      h2{color:#405570;font-size:17px;margin:22px 0 12px;border-bottom:1px solid #c8d0db;padding-bottom:6px;}
    </style></head><body>
    <div class="header">
      ${patient.foto_path ? `<img src="${patient.foto_path}" class="foto"/>` : `<div class="foto-ph">${initials}</div>`}
      <div style="flex:1">
        <div style="font-size:22px;font-weight:bold;color:#1A989D;">Centro Dermatológico</div>
        <div style="color:#405570;font-size:13px;">Historia Clínica del Paciente</div>
      </div>
      <div style="text-align:right;color:#aaa;font-size:11px;">Generado: ${new Date().toLocaleDateString('es-AR')}</div>
    </div>
    <h2>Datos Personales</h2>
    <div class="grid">
      <div><div class="fl">Nombre completo</div><div class="fv">${patient.nombre}</div></div>
      <div><div class="fl">DNI</div><div class="fv">${patient.dni}</div></div>
      ${patient.fecha_nacimiento ? `<div><div class="fl">Fecha de nacimiento</div><div class="fv">${formatDate(patient.fecha_nacimiento)}${age ? ` (${age} años)` : ''}</div></div>` : ''}
      ${patient.telefono ? `<div><div class="fl">Teléfono</div><div class="fv">${patient.telefono}</div></div>` : ''}
      ${patient.email ? `<div><div class="fl">Email</div><div class="fv">${patient.email}</div></div>` : ''}
      ${patient.direccion ? `<div><div class="fl">Dirección</div><div class="fv">${patient.direccion}</div></div>` : ''}
      ${patient.obra_social ? `<div><div class="fl">Obra Social</div><div class="fv">${patient.obra_social}</div></div>` : ''}
      ${patient.nro_afiliado ? `<div><div class="fl">Nro. Afiliado</div><div class="fv">${patient.nro_afiliado}</div></div>` : ''}
    </div>
    ${patient.motivo_consulta ? `<div style="margin-top:14px;padding:12px 16px;background:#f4f6f9;border-radius:8px;border-left:3px solid #1A989D;"><div class="fl">Motivo de consulta / Antecedentes</div><div class="fv" style="margin-top:4px;">${patient.motivo_consulta}</div></div>` : ''}
    <h2>Historial de Sesiones (${patient.sesiones.length})</h2>
    ${patient.sesiones.length > 0 ? sesiones : `<p style="color:#aaa;font-style:italic;">Sin sesiones registradas.</p>`}
    <div style="margin-top:40px;padding-top:14px;border-top:1px solid #eee;text-align:center;color:#bbb;font-size:11px;">
      Sistema de Gestión Instituto Cerrolaza · ${new Date().toLocaleString('es-AR')}
    </div>
  </body></html>`;
}

async function sendFichaEmail(patient) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Instituto Cerrolaza" <${config.email.user}>`,
    to: patient.email,
    subject: `Tu ficha clínica - ${patient.nombre}`,
    html: buildFichaHtml(patient),
  });
}

module.exports = { sendFichaEmail };
