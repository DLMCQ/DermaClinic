import { useRef } from "react";
import { C, inputStyle } from "../../utils/theme";
import { toBase64 } from "../../utils/helpers";

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
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
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder, required, disabled }) {
  return (
    <Field label={label ? `${label}${required ? " *" : ""}` : ""}>
      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }}
      />
    </Field>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <Field label={label}>
      <textarea
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: "vertical" }}
      />
    </Field>
  );
}

export function Select({ label, value, onChange, options, required }) {
  return (
    <Field label={label ? `${label}${required ? " *" : ""}` : ""}>
      <select
        value={value || ""}
        onChange={onChange}
        style={{ ...inputStyle, color: value ? C.text : C.muted }}
      >
        <option value="">Seleccionar...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ImageUpload({ label, value, onChange }) {
  const ref = useRef();
  const handle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar 5MB");
      return;
    }
    const b64 = await toBase64(file);
    onChange(b64);
  };
  return (
    <Field label={label}>
      <div
        onClick={() => ref.current.click()}
        style={{
          border: `2px dashed ${C.border}`,
          borderRadius: 10,
          padding: 12,
          cursor: "pointer",
          textAlign: "center",
          minHeight: value ? "auto" : 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          transition: "border-color 0.2s",
        }}
      >
        {value ? (
          <img
            src={value}
            alt=""
            style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }}
          />
        ) : (
          <>
            <div style={{ color: C.gold, fontSize: 22, marginBottom: 4 }}>
              📷
            </div>
            <div style={{ color: C.muted, fontSize: 12 }}>
              Click para subir imagen (max 5MB)
            </div>
          </>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handle}
      />
      {value && (
        <button
          onClick={() => onChange(null)}
          style={{
            marginTop: 6,
            background: "none",
            border: "none",
            color: C.danger,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ✕ Eliminar imagen
        </button>
      )}
    </Field>
  );
}
