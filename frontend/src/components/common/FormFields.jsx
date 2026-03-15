import { useRef, useState } from "react";
import { C, inputStyle } from "../../utils/theme";
import { api } from "../../utils/api";

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

export function ImageUpload({ label, value, onChange, uploadType = "general" }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar 5MB");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadImage(file, uploadType);
      onChange(result.url);
    } catch (err) {
      setError("Error al subir la imagen");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Field label={label}>
      <div
        onClick={() => !uploading && ref.current.click()}
        style={{
          border: `2px dashed ${error ? C.danger : C.border}`,
          borderRadius: 10,
          padding: 12,
          cursor: uploading ? "wait" : "pointer",
          textAlign: "center",
          minHeight: value ? "auto" : 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          transition: "border-color 0.2s",
          opacity: uploading ? 0.7 : 1,
        }}
      >
        {uploading ? (
          <div style={{ color: C.muted, fontSize: 13 }}>Subiendo imagen...</div>
        ) : value ? (
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
              {error || "Click para subir imagen (max 5MB)"}
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
      {value && !uploading && (
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
