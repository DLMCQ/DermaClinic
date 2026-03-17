const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
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
  const str = s instanceof Date ? s.toISOString() : String(s);
  const [y, m, d] = str.slice(0, 10).split('-');
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

function generatePdfBuffer(patient) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const TEAL   = '#1A989D';
    const DARK   = '#293647';
    const SLATE  = '#405570';
    const MUTED  = '#888888';
    const BORDER = '#c8d0db';
    const W      = 495; // ancho útil (595 - 2*50)
    const L      = 50;  // margen izquierdo

    // ── HEADER ──────────────────────────────────────────────
    doc.fontSize(22).fillColor(TEAL).font('Helvetica-Bold').text('Centro Dermatológico');
    doc.fontSize(12).fillColor(SLATE).font('Helvetica').text('Historia Clínica del Paciente');
    const headerDateY = doc.page.margins.top;
    doc.fontSize(10).fillColor(MUTED)
      .text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, L, headerDateY + 10, { align: 'right', width: W });
    doc.moveDown(0.5);
    doc.moveTo(L, doc.y).lineTo(L + W, doc.y).strokeColor(TEAL).lineWidth(2).stroke();
    doc.moveDown(1);

    // ── DATOS PERSONALES ────────────────────────────────────
    doc.fontSize(14).fillColor(SLATE).font('Helvetica-Bold').text('Datos Personales');
    doc.moveTo(L, doc.y + 2).lineTo(L + W, doc.y + 2).strokeColor(BORDER).lineWidth(1).stroke();
    doc.moveDown(0.7);

    const age = calcAge(patient.fecha_nacimiento);
    const fields = [
      ['Nombre completo', patient.nombre],
      ['DNI', patient.dni],
      patient.fecha_nacimiento
        ? ['Fecha de nacimiento', `${formatDate(patient.fecha_nacimiento)}${age ? ` (${age} años)` : ''}`]
        : null,
      patient.telefono    ? ['Teléfono',      patient.telefono]    : null,
      patient.email       ? ['Email',          patient.email]       : null,
      patient.direccion   ? ['Dirección',      patient.direccion]   : null,
      patient.obra_social ? ['Obra Social',    patient.obra_social] : null,
      patient.nro_afiliado ? ['Nro. Afiliado', patient.nro_afiliado] : null,
    ].filter(Boolean);

    // 2 columnas con posicionamiento absoluto
    const colW = 220;
    const col0 = L;
    const col1 = L + colW + 35;
    let rowY = doc.y;

    fields.forEach(([label, value], i) => {
      const isLeft = i % 2 === 0;
      const x = isLeft ? col0 : col1;

      if (isLeft) {
        rowY = doc.y;
      } else {
        doc.y = rowY;
      }

      doc.fontSize(9).fillColor(MUTED).font('Helvetica')
        .text(label.toUpperCase(), x, doc.y, { width: colW });
      doc.fontSize(13).fillColor(DARK).font('Helvetica')
        .text(String(value), x, doc.y, { width: colW });

      if (!isLeft) {
        doc.y = doc.y + 6;
      }
    });
    doc.moveDown(1);

    // Motivo de consulta
    if (patient.motivo_consulta) {
      const textY = doc.y + 8;
      doc.fontSize(9).fillColor(MUTED).font('Helvetica')
        .text('MOTIVO DE CONSULTA / ANTECEDENTES', L + 10, textY, { width: W - 20 });
      doc.fontSize(13).fillColor(DARK).font('Helvetica')
        .text(patient.motivo_consulta, L + 10, doc.y + 2, { width: W - 20 });
      const boxH = doc.y - textY + 14;
      doc.rect(L - 2, textY - 8, W + 4, boxH).strokeColor(TEAL).lineWidth(1).stroke();
      doc.moveDown(1);
    }

    // ── SESIONES ────────────────────────────────────────────
    const sesiones = [...patient.sesiones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    doc.fontSize(14).fillColor(SLATE).font('Helvetica-Bold')
      .text(`Historial de Sesiones (${sesiones.length})`);
    doc.moveTo(L, doc.y + 2).lineTo(L + W, doc.y + 2).strokeColor(BORDER).lineWidth(1).stroke();
    doc.moveDown(0.7);

    if (sesiones.length === 0) {
      doc.fontSize(12).fillColor(MUTED).font('Helvetica').text('Sin sesiones registradas.');
    } else {
      sesiones.forEach((s) => {
        if (doc.y > 700) doc.addPage();
        const boxTop = doc.y;

        doc.fontSize(14).fillColor(TEAL).font('Helvetica-Bold')
          .text(s.tratamiento, L + 8, doc.y, { continued: true, width: W - 120 });
        doc.fontSize(12).fillColor(MUTED).font('Helvetica')
          .text(formatDate(s.fecha), { align: 'right', width: 110 });
        doc.moveDown(0.3);

        if (s.productos) {
          doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
            .text('Productos: ', L + 8, doc.y, { continued: true });
          doc.font('Helvetica').fillColor(SLATE).text(s.productos);
        }
        if (s.notas) {
          doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
            .text('Notas: ', L + 8, doc.y, { continued: true });
          doc.font('Helvetica').fillColor(SLATE).text(s.notas);
        }

        const boxH = doc.y - boxTop + 10;
        doc.rect(L - 2, boxTop - 4, W + 4, boxH).strokeColor(BORDER).lineWidth(1).stroke();
        doc.moveDown(1);
      });
    }

    // ── FOOTER ──────────────────────────────────────────────
    doc.moveDown(1);
    doc.moveTo(L, doc.y).lineTo(L + W, doc.y).strokeColor('#eeeeee').lineWidth(1).stroke();
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor(MUTED).font('Helvetica')
      .text(`Sistema de Gestión Instituto Cerrolaza · ${new Date().toLocaleString('es-AR')}`, { align: 'center', width: W });

    doc.end();
  });
}

async function sendFichaEmail(patient) {
  const transporter = createTransporter();
  const pdfBuffer = await generatePdfBuffer(patient);
  const safeName = patient.nombre.replace(/\s+/g, '-');

  await transporter.sendMail({
    from: `"Instituto Cerrolaza" <${config.email.user}>`,
    to: patient.email,
    subject: `Tu ficha clínica - ${patient.nombre}`,
    text: `Hola ${patient.nombre},\n\nAdjuntamos tu ficha clínica del Instituto Cerrolaza.\n\nSaludos,\nInstituto Cerrolaza`,
    attachments: [
      {
        filename: `ficha-${safeName}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

module.exports = { sendFichaEmail };
