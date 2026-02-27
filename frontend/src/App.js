import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "./api";

// ─── Constantes ────────────────────────────────────────────────────────────────
const TRATAMIENTOS = [
  "Peeling Químico", "Hidratación Profunda", "Luz Pulsada (IPL)",
  "Radiofrecuencia", "Mesoterapia", "Microdermoabrasión",
  "Plasma Rico en Plaquetas (PRP)", "Toxina Botulínica",
  "Rellenos con Ácido Hialurónico", "Láser CO2 Fraccionado",
  "LED Terapia", "Limpieza Facial Profunda",
  "Tratamiento Anti-Acné", "Despigmentación", "Examen Dermatoscópico",
  "Otro",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(s) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
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

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── PDF Generator ─────────────────────────────────────────────────────────────
function generatePDF(patient) {
  const sesiones = [...patient.sesiones]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((s) => `
      <div style="page-break-inside:avoid;margin-bottom:22px;border:1px solid #ddd;border-radius:8px;padding:18px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <h3 style="margin:0;color:#8b5e3c;font-size:15px;">${s.tratamiento}</h3>
          <span style="color:#888;font-size:13px;">📅 ${formatDate(s.fecha)}</span>
        </div>
        ${s.productos ? `<p style="margin:5px 0;font-size:13px;"><strong>Productos:</strong> ${s.productos}</p>` : ""}
        ${s.notas ? `<p style="margin:5px 0;font-size:13px;"><strong>Notas:</strong> ${s.notas}</p>` : ""}
        ${(s.imagen_antes || s.imagen_despues) ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
            ${s.imagen_antes ? `<div><p style="font-size:11px;color:#888;margin:0 0 5px;text-transform:uppercase;letter-spacing:1px;">ANTES</p><img src="${s.imagen_antes}" style="width:100%;border-radius:6px;max-height:180px;object-fit:cover;"/></div>` : ""}
            ${s.imagen_despues ? `<div><p style="font-size:11px;color:#888;margin:0 0 5px;text-transform:uppercase;letter-spacing:1px;">DESPUÉS</p><img src="${s.imagen_despues}" style="width:100%;border-radius:6px;max-height:180px;object-fit:cover;"/></div>` : ""}
          </div>` : ""}
      </div>
    `).join("");

  const initials = patient.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const pw = window.open("", "_blank");
  pw.document.write(`<!DOCTYPE html><html lang="es"><head>
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
      @media print{body{padding:15px;}}
    </style></head><body>
    <div class="header">
      ${patient.foto_url ? `<img src="${patient.foto_url}" class="foto"/>` : `<div class="foto-ph">${initials}</div>`}
      <div style="flex:1">
        <div style="font-size:22px;font-weight:bold;color:#8b5e3c;">Centro Dermatológico</div>
        <div style="color:#a07848;font-size:13px;">Historia Clínica del Paciente</div>
      </div>
      <div style="text-align:right;color:#aaa;font-size:11px;">Generado: ${new Date().toLocaleDateString("es-AR")}</div>
    </div>
    <h2>Datos Personales</h2>
    <div class="grid">
      <div><div class="fl">Nombre completo</div><div class="fv">${patient.nombre}</div></div>
      <div><div class="fl">DNI</div><div class="fv">${patient.dni}</div></div>
      ${patient.fecha_nacimiento ? `<div><div class="fl">Fecha de nacimiento</div><div class="fv">${formatDate(patient.fecha_nacimiento)} (${calcAge(patient.fecha_nacimiento)} años)</div></div>` : ""}
      ${patient.telefono ? `<div><div class="fl">Teléfono</div><div class="fv">${patient.telefono}</div></div>` : ""}
      ${patient.email ? `<div><div class="fl">Email</div><div class="fv">${patient.email}</div></div>` : ""}
      ${patient.direccion ? `<div><div class="fl">Dirección</div><div class="fv">${patient.direccion}</div></div>` : ""}
      ${patient.obra_social ? `<div><div class="fl">Obra Social</div><div class="fv">${patient.obra_social}</div></div>` : ""}
      ${patient.nro_afiliado ? `<div><div class="fl">Nro. Afiliado</div><div class="fv">${patient.nro_afiliado}</div></div>` : ""}
    </div>
    ${patient.motivo_consulta ? `<div style="margin-top:14px;padding:12px 16px;background:#fdf8f3;border-radius:8px;border-left:3px solid #c9a96e;"><div class="fl">Motivo de consulta / Antecedentes</div><div class="fv" style="margin-top:4px;">${patient.motivo_consulta}</div></div>` : ""}
    <h2>Historial de Sesiones (${patient.sesiones.length})</h2>
    ${patient.sesiones.length > 0 ? sesiones : `<p style="color:#aaa;font-style:italic;">Sin sesiones registradas.</p>`}
    <div style="margin-top:40px;padding-top:14px;border-top:1px solid #eee;text-align:center;color:#bbb;font-size:11px;">
      Sistema de Gestión DermaClinic · ${new Date().toLocaleString("es-AR")}
    </div>
  </body></html>`);
  pw.document.close();
  setTimeout(() => pw.print(), 600);
}

// ─── UI Primitivos ─────────────────────────────────────────────────────────────
const C = {
  bg: "#0f0c09", surface: "#1a1410", border: "#3a2e24",
  gold: "#c9a96e", goldLight: "#a0896a", text: "#e8d5b7",
  muted: "#666", danger: "#e05a5a", success: "#5a9e6f",
};

function Avatar({ url, name, size = 80 }) {
  const ini = name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: url ? "transparent" : `linear-gradient(135deg, ${C.gold}, #8b5e3c)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", border: `3px solid ${C.gold}`, flexShrink: 0,
      fontSize: size * 0.3, fontWeight: 700, color: "#fff", fontFamily: "serif",
    }}>
      {url ? <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18,
          padding: 32, width: wide ? 780 : 520, maxWidth: "96vw",
          maxHeight: "92vh", overflowY: "auto",
          boxShadow: "0 30px 100px rgba(0,0,0,0.9)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
          <h2 style={{ color: C.gold, fontSize: 20, fontFamily: "serif", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 26, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, style }) {
  const base = { border: "none", borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, fontSize: size === "sm" ? 12 : 14, padding: size === "sm" ? "6px 13px" : "10px 20px", fontFamily: "inherit" };
  const v = {
    primary: { background: `linear-gradient(135deg, ${C.gold}, #a07848)`, color: "#0f0c09" },
    ghost: { background: "transparent", color: C.gold, border: `1px solid ${C.border}` },
    danger: { background: "transparent", color: C.danger, border: `1px solid ${C.danger}` },
    success: { background: `linear-gradient(135deg, ${C.success}, #3a7d50)`, color: "#fff" },
  };
  return <button style={{ ...base, ...v[variant], ...style }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", color: C.goldLight, fontSize: 11, marginBottom: 6, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</label>}
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "10px 14px", fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

function Input({ label, value, onChange, type = "text", placeholder, required, disabled }) {
  return <Field label={label ? `${label}${required ? " *" : ""}` : ""}><input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} disabled={disabled} style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }} /></Field>;
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return <Field label={label}><textarea value={value || ""} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...inputStyle, resize: "vertical" }} /></Field>;
}

function Select({ label, value, onChange, options, required }) {
  return (
    <Field label={label ? `${label}${required ? " *" : ""}` : ""}>
      <select value={value || ""} onChange={onChange} style={{ ...inputStyle, color: value ? C.text : C.muted }}>
        <option value="">Seleccionar...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

function ImageUpload({ label, value, onChange }) {
  const ref = useRef();
  const handle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("La imagen no puede superar 5MB"); return; }
    const b64 = await toBase64(file);
    onChange(b64);
  };
  return (
    <Field label={label}>
      <div onClick={() => ref.current.click()} style={{
        border: `2px dashed ${C.border}`, borderRadius: 10, padding: 12,
        cursor: "pointer", textAlign: "center", minHeight: value ? "auto" : 80,
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        transition: "border-color 0.2s",
      }}>
        {value
          ? <img src={value} alt="" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
          : <><div style={{ color: C.gold, fontSize: 22, marginBottom: 4 }}>📷</div><div style={{ color: C.muted, fontSize: 12 }}>Click para subir imagen (max 5MB)</div></>}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handle} />
      {value && <button onClick={() => onChange(null)} style={{ marginTop: 6, background: "none", border: "none", color: C.danger, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕ Eliminar imagen</button>}
    </Field>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: type === "error" ? "#3d1515" : "#0f2a1a",
      border: `1px solid ${type === "error" ? C.danger : C.success}`,
      color: type === "error" ? C.danger : "#7ed4a0",
      borderRadius: 12, padding: "14px 22px", fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      animation: "slideIn 0.3s ease",
    }}>
      {type === "error" ? "❌ " : "✅ "}{message}
    </div>
  );
}

// ─── Formulario Paciente ──────────────────────────────────────────────────────
function PatientForm({ patient, onSave, onClose, loading }) {
  const [form, setForm] = useState(patient ? {
    nombre: patient.nombre || "", dni: patient.dni || "",
    fecha_nacimiento: patient.fecha_nacimiento || "", telefono: patient.telefono || "",
    email: patient.email || "", direccion: patient.direccion || "",
    obra_social: patient.obra_social || "", nro_afiliado: patient.nro_afiliado || "",
    motivo_consulta: patient.motivo_consulta || "", foto_url: patient.foto_url || null,
  } : { nombre: "", dni: "", fecha_nacimiento: "", telefono: "", email: "", direccion: "", obra_social: "", nro_afiliado: "", motivo_consulta: "", foto_url: null });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <ImageUpload label="Foto de la paciente" value={form.foto_url} onChange={(v) => setForm((f) => ({ ...f, foto_url: v }))} />
        </div>
        <Input label="Nombre completo" value={form.nombre} onChange={set("nombre")} required />
        <Input label="DNI" value={form.dni} onChange={set("dni")} required />
        <Input label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} type="date" />
        <Input label="Teléfono" value={form.telefono} onChange={set("telefono")} />
        <Input label="Email" value={form.email} onChange={set("email")} type="email" />
        <Input label="Dirección" value={form.direccion} onChange={set("direccion")} />
        <Input label="Obra social / Prepaga" value={form.obra_social} onChange={set("obra_social")} />
        <Input label="Nro. afiliado" value={form.nro_afiliado} onChange={set("nro_afiliado")} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Textarea label="Motivo de consulta / Antecedentes" value={form.motivo_consulta} onChange={set("motivo_consulta")} rows={3} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
        <Btn disabled={loading} onClick={() => {
          if (!form.nombre.trim() || !form.dni.trim()) { alert("Nombre y DNI son obligatorios"); return; }
          onSave(form);
        }}>
          {loading ? "Guardando..." : patient ? "Guardar cambios" : "Crear paciente"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Formulario Sesión ─────────────────────────────────────────────────────────
function SessionForm({ session, onSave, onClose, loading }) {
  const [form, setForm] = useState(session ? {
    fecha: session.fecha || "", tratamiento: session.tratamiento || "",
    productos: session.productos || "", notas: session.notas || "",
    imagen_antes: session.imagen_antes || null, imagen_despues: session.imagen_despues || null,
  } : { fecha: new Date().toISOString().split("T")[0], tratamiento: "", productos: "", notas: "", imagen_antes: null, imagen_despues: null });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Fecha" value={form.fecha} onChange={set("fecha")} type="date" required />
        <Select label="Tratamiento" value={form.tratamiento} onChange={set("tratamiento")} options={TRATAMIENTOS} required />
        <div style={{ gridColumn: "1 / -1" }}>
          <Textarea label="Productos / Materiales utilizados" value={form.productos} onChange={set("productos")} placeholder="Ej: Ácido glicólico 30%, crema hidratante SPF50..." />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Textarea label="Notas de la sesión" value={form.notas} onChange={set("notas")} placeholder="Observaciones, reacciones, indicaciones para la paciente..." />
        </div>
        <ImageUpload label="📷 Foto ANTES" value={form.imagen_antes} onChange={(v) => setForm((f) => ({ ...f, imagen_antes: v }))} />
        <ImageUpload label="📷 Foto DESPUÉS" value={form.imagen_despues} onChange={(v) => setForm((f) => ({ ...f, imagen_despues: v }))} />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
        <Btn disabled={loading} onClick={() => {
          if (!form.fecha || !form.tratamiento) { alert("Fecha y tratamiento son obligatorios"); return; }
          onSave(form);
        }}>
          {loading ? "Guardando..." : session ? "Guardar cambios" : "Registrar sesión"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Formulario Usuario ───────────────────────────────────────────────────────
function UserForm({ user, onSave, onClose, loading }) {
  const [form, setForm] = useState(user ? {
    email: user.email || "", nombre: user.nombre || "", role: user.role || "doctor", password: "",
  } : { email: "", nombre: "", role: "doctor", password: "" });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Email" value={form.email} onChange={set("email")} type="email" required />
        <Input label="Nombre completo" value={form.nombre} onChange={set("nombre")} required />
        <Select label="Rol" value={form.role} onChange={set("role")} options={["doctor", "admin"]} required />
        <Input label={user ? "Nueva contraseña (opcional)" : "Contraseña"} value={form.password} onChange={set("password")} type="password" placeholder={user ? "Dejar en blanco para no cambiar" : "••••••••"} required={!user} />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
        <Btn disabled={loading} onClick={() => {
          if (!form.email.trim() || !form.nombre.trim()) { alert("Email y nombre son obligatorios"); return; }
          if (!user && !form.password.trim()) { alert("Contraseña requerida para nuevo usuario"); return; }
          onSave(form);
        }}>
          {loading ? "Guardando..." : user ? "Guardar cambios" : "Crear usuario"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Componente Login ──────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email y contraseña requeridos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.login(email, password);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));
      onLogin(response.user);
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: 48,
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 30px 100px rgba(0,0,0,0.9)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.gold}, #8b5e3c)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 16px",
            }}
          >
            ⚕
          </div>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 28,
              color: C.gold,
              fontFamily: "serif",
              fontWeight: 700,
            }}
          >
            DermaClinic
          </h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>
            Sistema de Gestión
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                color: C.goldLight,
                fontSize: 11,
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={loading}
              style={{
                ...inputStyle,
                opacity: loading ? 0.5 : 1,
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                color: C.goldLight,
                fontSize: 11,
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              style={{
                ...inputStyle,
                opacity: loading ? 0.5 : 1,
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(224,90,90,0.1)",
                border: `1px solid ${C.danger}`,
                color: C.danger,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 18,
                fontWeight: 500,
              }}
            >
              ❌ {error}
            </div>
          )}

          <Btn
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              fontSize: 15,
              fontWeight: 700,
              padding: "14px 20px",
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Btn>
        </form>

        <div
          style={{
            marginTop: 20,
            padding: 12,
            background: C.bg,
            borderRadius: 8,
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, color: C.gold }}>
            Credenciales de prueba:
          </div>
          demo@dermaclinic.com / password
        </div>
      </div>
    </div>
  );
}

// ─── App Principal ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null); // paciente seleccionado (con sesiones)
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [adminTab, setAdminTab] = useState("pacientes"); // "pacientes" o "usuarios"
  const [usuarios, setUsuarios] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const searchTimeout = useRef();

  const showToast = (message, type = "success") => setToast({ message, type });

  // Cargar lista de pacientes
  const loadPatients = useCallback(async (q) => {
    try {
      const data = await api.getPacientes(q);
      setPatients(data);
    } catch (e) {
      showToast("Error al cargar pacientes: " + e.message, "error");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  // Cargar usuarios cuando se abre la vista de admin
  useEffect(() => {
    if (user?.role === "admin" && adminTab === "usuarios") {
      loadUsuarios();
    }
  }, [adminTab, user?.role, loadUsuarios]);

  // Búsqueda con debounce
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadPatients(search || undefined), 300);
  }, [search, loadPatients]);

  // Seleccionar paciente y cargar con sesiones
  const selectPatient = async (p) => {
    try {
      const data = await api.getPaciente(p.id);
      setSelected(data);
    } catch (e) {
      showToast("Error al cargar ficha: " + e.message, "error");
    }
  };

  // CRUD Pacientes
  const savePatient = async (form) => {
    setLoading(true);
    try {
      if (modal === "newPatient") {
        const newP = await api.createPaciente(form);
        setPatients((ps) => [{ ...newP, total_sesiones: 0 }, ...ps].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setSelected(newP);
        showToast("Paciente creada correctamente");
      } else {
        const updated = await api.updatePaciente(selected.id, form);
        setPatients((ps) => ps.map((p) => p.id === selected.id ? { ...p, ...updated } : p));
        setSelected((s) => ({ ...s, ...updated }));
        showToast("Ficha actualizada");
      }
      setModal(null);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = (id) => setConfirmDelete({ type: "patient", id });

  const doDeletePatient = async () => {
    setLoading(true);
    try {
      await api.deletePaciente(confirmDelete.id);
      setPatients((ps) => ps.filter((p) => p.id !== confirmDelete.id));
      if (selected?.id === confirmDelete.id) setSelected(null);
      showToast("Paciente eliminada");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  // CRUD Sesiones
  const saveSession = async (form) => {
    setLoading(true);
    try {
      if (modal === "newSession") {
        const s = await api.createSesion({ ...form, paciente_id: selected.id });
        const updatedSesiones = [s, ...selected.sesiones];
        setSelected((sp) => ({ ...sp, sesiones: updatedSesiones }));
        setPatients((ps) => ps.map((p) => p.id === selected.id ? { ...p, total_sesiones: (p.total_sesiones || 0) + 1 } : p));
        showToast("Sesión registrada");
      } else {
        const updated = await api.updateSesion(editingSession.id, form);
        const updatedSesiones = selected.sesiones.map((s) => s.id === editingSession.id ? updated : s);
        setSelected((sp) => ({ ...sp, sesiones: updatedSesiones }));
        showToast("Sesión actualizada");
      }
      setModal(null);
      setEditingSession(null);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = (id) => setConfirmDelete({ type: "session", id });

  const doDeleteSession = async () => {
    setLoading(true);
    try {
      await api.deleteSesion(confirmDelete.id);
      const updatedSesiones = selected.sesiones.filter((s) => s.id !== confirmDelete.id);
      setSelected((sp) => ({ ...sp, sesiones: updatedSesiones }));
      setPatients((ps) => ps.map((p) => p.id === selected.id ? { ...p, total_sesiones: Math.max(0, (p.total_sesiones || 1) - 1) } : p));
      showToast("Sesión eliminada");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  // CRUD Usuarios (Admin)
  const loadUsuarios = useCallback(async () => {
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (e) {
      showToast("Error al cargar usuarios: " + e.message, "error");
    }
  }, []);

  const saveUsuario = async (form) => {
    setLoading(true);
    try {
      if (editingUser) {
        const updated = await api.updateUsuario(editingUser.id, form);
        setUsuarios((us) => us.map((u) => u.id === editingUser.id ? updated : u));
        showToast("Usuario actualizado");
      } else {
        const newU = await api.createUsuario(form);
        setUsuarios((us) => [newU, ...us].sort((a, b) => a.email.localeCompare(b.email)));
        showToast("Usuario creado correctamente");
      }
      setModal(null);
      setEditingUser(null);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteUsuario = (id) => setConfirmDelete({ type: "user", id });

  const doDeleteUsuario = async () => {
    setLoading(true);
    try {
      await api.deleteUsuario(confirmDelete.id);
      setUsuarios((us) => us.filter((u) => u.id !== confirmDelete.id));
      showToast("Usuario eliminado");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } input:focus, select:focus, textarea:focus { border-color: ${C.gold} !important; }`}</style>

      {!user ? (
        <LoginPage onLogin={setUser} />
      ) : (
        <>
          {/* Header */}
          <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", alignItems: "center", height: 66, gap: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, #8b5e3c)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚕</div>
            <div>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 17, fontFamily: "serif", letterSpacing: 0.5 }}>DermaClinic</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: -1 }}>Sistema de Gestión · Red Local</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success }} />
                <span style={{ color: C.muted, fontSize: 12 }}>Servidor activo</span>
              </div>
              <div style={{ height: 20, width: 1, background: C.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: C.goldLight, fontSize: 13, fontWeight: 500 }}>{user.email || "Usuario"}</span>
                {user.role === "admin" && (
                  <>
                    <div style={{ height: 16, width: 1, background: C.border }} />
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => setAdminTab(adminTab === "pacientes" ? "usuarios" : "pacientes")}
                      style={{ padding: "5px 10px" }}
                    >
                      {adminTab === "usuarios" ? "👥 Usuarios" : "👤 Gestión"}
                    </Btn>
                  </>
                )}
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    api.logout();
                    setUser(null);
                  }}
                  style={{ padding: "5px 10px" }}
                >
                  Cerrar sesión
                </Btn>
              </div>
            </div>
          </div>

      {/* Layout */}
      <div style={{ display: "flex", height: "calc(100vh - 66px)" }}>
        {/* Sidebar */}
        <div style={{ width: 340, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", background: "#120f0b", flexShrink: 0 }}>
          <div style={{ padding: "18px 16px 14px" }}>
            {adminTab === "pacientes" ? (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 Buscar por nombre o DNI..."
                  style={{ ...inputStyle, flex: 1, fontSize: 13, padding: "9px 12px" }}
                />
                <Btn onClick={() => setModal("newPatient")}>+ Nueva</Btn>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <Btn style={{ flex: 1 }} onClick={() => setModal("newUser")}>+ Nuevo Usuario</Btn>
              </div>
            )}
            <div style={{ color: C.muted, fontSize: 12 }}>
              {adminTab === "pacientes"
                ? `${patients.length} paciente${patients.length !== 1 ? "s" : ""}`
                : `${usuarios.length} usuario${usuarios.length !== 1 ? "s" : ""}`}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {adminTab === "pacientes" ? (
              <>
                {pageLoading
                  ? <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>Conectando con el servidor...</div>
                  : patients.length === 0
                    ? <div style={{ color: C.muted, textAlign: "center", padding: 40, fontSize: 14, lineHeight: 1.8 }}>
                        {search ? "Sin resultados para la búsqueda." : "No hay pacientes registradas.\nHaga clic en '+ Nueva' para comenzar."}
                      </div>
                    : patients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        style={{
                          background: selected?.id === p.id ? "rgba(201,169,110,0.1)" : C.surface,
                          border: `1px solid ${selected?.id === p.id ? C.gold : C.border}`,
                          borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                          display: "flex", alignItems: "center", gap: 14,
                        }}
                        onMouseEnter={(e) => { if (selected?.id !== p.id) e.currentTarget.style.borderColor = `${C.gold}88`; }}
                        onMouseLeave={(e) => { if (selected?.id !== p.id) e.currentTarget.style.borderColor = C.border; }}
                      >
                        <Avatar url={p.foto_url} name={p.nombre} size={48} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                          <div style={{ color: C.goldLight, fontSize: 12, marginTop: 2 }}>DNI: {p.dni}{p.fecha_nacimiento ? ` · ${calcAge(p.fecha_nacimiento)} años` : ""}</div>
                          <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{p.total_sesiones} sesión{p.total_sesiones !== 1 ? "es" : ""}</div>
                        </div>
                        <Btn variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); deletePatient(p.id); }} style={{ padding: "5px 10px" }}>🗑</Btn>
                      </div>
                    ))
                }
              </>
            ) : (
              <>
                {usuarios.length === 0
                  ? <div style={{ color: C.muted, textAlign: "center", padding: 40, fontSize: 14, lineHeight: 1.8 }}>
                      No hay usuarios registrados.
                    </div>
                  : usuarios.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setEditingUser(u)}
                      style={{
                        background: editingUser?.id === u.id ? "rgba(201,169,110,0.1)" : C.surface,
                        border: `1px solid ${editingUser?.id === u.id ? C.gold : C.border}`,
                        borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", gap: 14,
                      }}
                      onMouseEnter={(e) => { if (editingUser?.id !== u.id) e.currentTarget.style.borderColor = `${C.gold}88`; }}
                      onMouseLeave={(e) => { if (editingUser?.id !== u.id) e.currentTarget.style.borderColor = C.border; }}
                    >
                      <Avatar name={u.nombre} size={48} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: C.text, fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.nombre}</div>
                        <div style={{ color: C.goldLight, fontSize: 12, marginTop: 2 }}>{u.email}</div>
                        <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Rol: {u.role === "admin" ? "👑 Administrador" : "⚕️ Doctor"}</div>
                      </div>
                      <Btn variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); deleteUsuario(u.id); }} style={{ padding: "5px 10px" }}>🗑</Btn>
                    </div>
                  ))
                }
              </>
            )}
          </div>
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {adminTab === "usuarios" && editingUser ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28 }}>
              <h2 style={{ margin: "0 0 20px", color: C.gold, fontSize: 20, fontFamily: "serif" }}>Detalles del Usuario</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", marginBottom: 20 }}>
                <div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nombre</div>
                  <div style={{ color: C.goldLight, fontSize: 15, fontWeight: 500 }}>{editingUser.nombre}</div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Email</div>
                  <div style={{ color: C.goldLight, fontSize: 15, fontWeight: 500 }}>{editingUser.email}</div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Rol</div>
                  <div style={{ color: C.goldLight, fontSize: 15, fontWeight: 500 }}>{editingUser.role === "admin" ? "👑 Administrador" : "⚕️ Doctor"}</div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Estado</div>
                  <div style={{ color: editingUser.is_active ? C.success : C.danger, fontSize: 15, fontWeight: 500 }}>{editingUser.is_active ? "✅ Activo" : "❌ Inactivo"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => setEditingUser(null)}>Cerrar</Btn>
                <Btn onClick={() => setModal("editUser")}>✏️ Editar</Btn>
              </div>
            </div>
          ) : adminTab === "usuarios" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: C.border }}>
              <div style={{ fontSize: 64, marginBottom: 16, filter: "grayscale(1)" }}>👥</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.muted }}>Seleccione un usuario</div>
              <div style={{ fontSize: 13, color: C.border, marginTop: 6 }}>o cree uno nuevo</div>
            </div>
          ) : !selected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: C.border }}>
              <div style={{ fontSize: 64, marginBottom: 16, filter: "grayscale(1)" }}>🌸</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.muted }}>Seleccione una paciente</div>
              <div style={{ fontSize: 13, color: C.border, marginTop: 6 }}>o cree una nueva ficha</div>
            </div>
          ) : (
            <>
              {/* Ficha paciente */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, marginBottom: 22 }}>
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                  <Avatar url={selected.foto_url} name={selected.nombre} size={100} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                      <h1 style={{ margin: 0, fontSize: 26, color: C.text, fontWeight: 700, fontFamily: "serif" }}>{selected.nombre}</h1>
                      {calcAge(selected.fecha_nacimiento) && (
                        <span style={{ background: "rgba(201,169,110,0.15)", color: C.gold, fontSize: 12, padding: "3px 12px", borderRadius: 20, fontWeight: 600 }}>
                          {calcAge(selected.fecha_nacimiento)} años
                        </span>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "5px 24px" }}>
                      {[
                        ["DNI", selected.dni], ["Teléfono", selected.telefono], ["Email", selected.email],
                        ["Dirección", selected.direccion], ["Obra Social", selected.obra_social], ["Nro. Afiliado", selected.nro_afiliado],
                        ["Fecha Nac.", selected.fecha_nacimiento ? formatDate(selected.fecha_nacimiento) : null],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}>
                          <span style={{ color: C.muted, fontSize: 12 }}>{k}: </span>
                          <span style={{ color: C.goldLight, fontSize: 13, fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {selected.motivo_consulta && (
                      <div style={{ marginTop: 14, padding: "10px 16px", background: C.bg, borderRadius: 8, borderLeft: `3px solid ${C.gold}` }}>
                        <div style={{ color: C.muted, fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Motivo de consulta</div>
                        <div style={{ color: C.goldLight, fontSize: 14 }}>{selected.motivo_consulta}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9, flexShrink: 0 }}>
                    <Btn variant="ghost" size="sm" onClick={() => setModal("editPatient")}>✏️ Editar ficha</Btn>
                    <Btn variant="success" size="sm" onClick={() => generatePDF(selected)}>📄 Exportar PDF</Btn>
                  </div>
                </div>
              </div>

              {/* Sesiones */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ margin: 0, color: C.gold, fontSize: 19, fontFamily: "serif" }}>
                  Historial de sesiones <span style={{ color: C.muted, fontWeight: 400, fontSize: 14 }}>({selected.sesiones?.length || 0})</span>
                </h2>
                <Btn onClick={() => setModal("newSession")}>+ Nueva sesión</Btn>
              </div>

              {!selected.sesiones?.length
                ? <div style={{ textAlign: "center", padding: 52, color: C.border, border: `2px dashed ${C.border}`, borderRadius: 14 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                    <div>Sin sesiones registradas aún</div>
                  </div>
                : [...(selected.sesiones || [])].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((s) => (
                  <div key={s.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ color: C.text, fontWeight: 700, fontSize: 17, fontFamily: "serif" }}>{s.tratamiento}</div>
                        <div style={{ color: C.gold, fontSize: 13, marginTop: 3 }}>📅 {formatDate(s.fecha)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn variant="ghost" size="sm" onClick={() => { setEditingSession(s); setModal("editSession"); }}>✏️</Btn>
                        <Btn variant="danger" size="sm" onClick={() => deleteSession(s.id)}>🗑</Btn>
                      </div>
                    </div>
                    {s.productos && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Productos utilizados</div>
                        <div style={{ color: C.goldLight, fontSize: 14 }}>{s.productos}</div>
                      </div>
                    )}
                    {s.notas && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Notas</div>
                        <div style={{ color: C.goldLight, fontSize: 14 }}>{s.notas}</div>
                      </div>
                    )}
                    {(s.imagen_antes || s.imagen_despues) && (
                      <div style={{ display: "grid", gridTemplateColumns: s.imagen_antes && s.imagen_despues ? "1fr 1fr" : "1fr", gap: 14, marginTop: 14 }}>
                        {s.imagen_antes && (
                          <div>
                            <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>📷 Antes</div>
                            <img src={s.imagen_antes} alt="antes" style={{ width: "100%", borderRadius: 8, maxHeight: 240, objectFit: "cover" }} />
                          </div>
                        )}
                        {s.imagen_despues && (
                          <div>
                            <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>📷 Después</div>
                            <img src={s.imagen_despues} alt="despues" style={{ width: "100%", borderRadius: 8, maxHeight: 240, objectFit: "cover" }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              }
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {modal === "newPatient" && (
        <Modal title="Nueva Paciente" onClose={() => setModal(null)} wide>
          <PatientForm onSave={savePatient} onClose={() => setModal(null)} loading={loading} />
        </Modal>
      )}
      {modal === "editPatient" && selected && (
        <Modal title="Editar Ficha" onClose={() => setModal(null)} wide>
          <PatientForm patient={selected} onSave={savePatient} onClose={() => setModal(null)} loading={loading} />
        </Modal>
      )}
      {modal === "newSession" && (
        <Modal title="Nueva Sesión" onClose={() => setModal(null)} wide>
          <SessionForm onSave={saveSession} onClose={() => setModal(null)} loading={loading} />
        </Modal>
      )}
      {modal === "editSession" && editingSession && (
        <Modal title="Editar Sesión" onClose={() => { setModal(null); setEditingSession(null); }} wide>
          <SessionForm session={editingSession} onSave={saveSession} onClose={() => { setModal(null); setEditingSession(null); }} loading={loading} />
        </Modal>
      )}
      {modal === "newUser" && (
        <Modal title="Nuevo Usuario" onClose={() => setModal(null)}>
          <UserForm onSave={saveUsuario} onClose={() => setModal(null)} loading={loading} />
        </Modal>
      )}
      {modal === "editUser" && editingUser && (
        <Modal title="Editar Usuario" onClose={() => { setModal(null); setEditingUser(null); }}>
          <UserForm user={editingUser} onSave={saveUsuario} onClose={() => { setModal(null); setEditingUser(null); }} loading={loading} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Confirmar eliminación" onClose={() => setConfirmDelete(null)}>
          <p style={{ color: C.goldLight, marginBottom: 24, lineHeight: 1.6 }}>
            {confirmDelete.type === "patient"
              ? "¿Eliminar esta paciente y todo su historial de sesiones? Esta acción no se puede deshacer."
              : confirmDelete.type === "session"
                ? "¿Eliminar esta sesión? Esta acción no se puede deshacer."
                : "¿Eliminar este usuario? Esta acción no se puede deshacer."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)} disabled={loading}>Cancelar</Btn>
            <Btn variant="danger" disabled={loading} onClick={confirmDelete.type === "patient" ? doDeletePatient : confirmDelete.type === "session" ? doDeleteSession : doDeleteUsuario}>
              {loading ? "Eliminando..." : "Sí, eliminar"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
      )}
    </div>
  );
}
