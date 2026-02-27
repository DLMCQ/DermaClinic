import { supabase } from '../lib/supabase'

export async function generarPDF(paciente, sesiones) {
  let fotoBase64 = ''
  if (paciente.foto_url) {
    const { data } = supabase.storage.from('fotos-pacientes').getPublicUrl(paciente.foto_url)
    fotoBase64 = data.publicUrl
  }

  function formatFecha(f) {
    if (!f) return '-'
    const [y, m, d] = f.split('-')
    return `${d}/${m}/${y}`
  }

  function calcularEdad(fechaNac) {
    if (!fechaNac) return ''
    const hoy = new Date()
    const nac = new Date(fechaNac)
    let edad = hoy.getFullYear() - nac.getFullYear()
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--
    return `${edad} años`
  }

  function imgUrl(path, bucket) {
    if (!path) return ''
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  const sesionesHTML = sesiones.map(s => `
    <div class="sesion">
      <div class="sesion-header">
        <span class="tratamiento">${s.tratamiento}</span>
        <span class="fecha">${formatFecha(s.fecha)}</span>
      </div>
      ${s.productos ? `<div class="sesion-campo"><strong>Productos:</strong> ${s.productos}</div>` : ''}
      ${s.notas ? `<div class="sesion-campo"><strong>Notas:</strong> ${s.notas}</div>` : ''}
      ${(s.imagen_antes_url || s.imagen_despues_url) ? `
        <div class="imagenes">
          ${s.imagen_antes_url ? `<div class="img-wrapper"><div class="img-label">ANTES</div><img src="${imgUrl(s.imagen_antes_url, 'imagenes-sesiones')}" /></div>` : ''}
          ${s.imagen_despues_url ? `<div class="img-wrapper"><div class="img-label">DESPUÉS</div><img src="${imgUrl(s.imagen_despues_url, 'imagenes-sesiones')}" /></div>` : ''}
        </div>
      ` : ''}
    </div>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Ficha - ${paciente.apellido}, ${paciente.nombre}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', serif; color: #1a0a00; background: #fff; padding: 32px; font-size: 13px; }
        .header { display: flex; align-items: flex-start; gap: 24px; padding-bottom: 20px; border-bottom: 2px solid #c9a96e; margin-bottom: 24px; }
        .foto { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #c9a96e; flex-shrink: 0; background: #f0e8d8; }
        .foto-placeholder { width: 100px; height: 100px; border-radius: 50%; background: #8b5e3c; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #fff; flex-shrink: 0; }
        .info-principal { flex: 1; }
        .clinica { font-size: 11px; color: #8b5e3c; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
        .nombre { font-size: 22px; font-weight: bold; color: #1a0a00; margin-bottom: 4px; }
        .dni { font-size: 13px; color: #5a3a20; margin-bottom: 12px; }
        .datos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .dato { }
        .dato-label { font-size: 9px; color: #8b5e3c; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 1px; }
        .dato-valor { font-size: 12px; color: #1a0a00; }
        .motivo { margin-top: 14px; padding: 10px 14px; background: #fdf6ec; border-left: 3px solid #c9a96e; }
        .motivo-label { font-size: 9px; color: #8b5e3c; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
        .sesiones-titulo { font-size: 16px; font-weight: bold; color: #1a0a00; margin-bottom: 14px; border-bottom: 1px solid #e8d5b7; padding-bottom: 6px; }
        .sesion { margin-bottom: 16px; padding: 14px; border: 1px solid #e8d5b7; border-radius: 6px; break-inside: avoid; }
        .sesion-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .tratamiento { font-size: 14px; font-weight: bold; color: #1a0a00; }
        .fecha { font-size: 12px; color: #8b5e3c; }
        .sesion-campo { font-size: 12px; color: #1a0a00; margin-bottom: 4px; line-height: 1.5; }
        .imagenes { display: flex; gap: 12px; margin-top: 10px; }
        .img-wrapper { flex: 1; text-align: center; }
        .img-label { font-size: 9px; color: #8b5e3c; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
        .imagenes img { width: 100%; max-height: 180px; object-fit: cover; border-radius: 4px; border: 1px solid #e8d5b7; }
        .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e8d5b7; font-size: 10px; color: #8b5e3c; text-align: right; }
        @media print {
          body { padding: 16px; }
          .sesion { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${fotoBase64
          ? `<img class="foto" src="${fotoBase64}" />`
          : `<div class="foto-placeholder">${paciente.nombre?.[0] || ''}${paciente.apellido?.[0] || ''}</div>`
        }
        <div class="info-principal">
          <div class="clinica">DermaClinic · Ficha de Paciente</div>
          <div class="nombre">${paciente.apellido}, ${paciente.nombre}</div>
          <div class="dni">DNI: ${paciente.dni}${paciente.fecha_nacimiento ? ` · ${calcularEdad(paciente.fecha_nacimiento)} · Nac: ${formatFecha(paciente.fecha_nacimiento)}` : ''}</div>
          <div class="datos-grid">
            ${paciente.telefono ? `<div class="dato"><div class="dato-label">Teléfono</div><div class="dato-valor">${paciente.telefono}</div></div>` : ''}
            ${paciente.email ? `<div class="dato"><div class="dato-label">Email</div><div class="dato-valor">${paciente.email}</div></div>` : ''}
            ${paciente.direccion ? `<div class="dato"><div class="dato-label">Dirección</div><div class="dato-valor">${paciente.direccion}</div></div>` : ''}
            ${paciente.obra_social ? `<div class="dato"><div class="dato-label">Obra Social</div><div class="dato-valor">${paciente.obra_social}${paciente.nro_afiliado ? ` · ${paciente.nro_afiliado}` : ''}</div></div>` : ''}
          </div>
          ${paciente.motivo_consulta ? `
            <div class="motivo">
              <div class="motivo-label">Motivo de Consulta</div>
              ${paciente.motivo_consulta}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="sesiones-titulo">Historial de Sesiones (${sesiones.length})</div>
      ${sesiones.length > 0 ? sesionesHTML : '<p style="color:#8b5e3c;font-size:13px;">Sin sesiones registradas</p>'}

      <div class="footer">
        Generado el ${new Date().toLocaleDateString('es-AR')} · DermaClinic
      </div>

      <script>window.onload = () => window.print()</script>
    </body>
    </html>
  `

  const ventana = window.open('', '_blank')
  ventana.document.write(html)
  ventana.document.close()
}
