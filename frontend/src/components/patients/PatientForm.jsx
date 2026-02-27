import { useState } from "react";
import { Btn } from "../common/Btn";
import { Input, Textarea, ImageUpload } from "../common/FormFields";

export function PatientForm({ patient, onSave, onClose, loading }) {
  const [form, setForm] = useState(
    patient
      ? {
          nombre: patient.nombre || "",
          dni: patient.dni || "",
          fecha_nacimiento: patient.fecha_nacimiento || "",
          telefono: patient.telefono || "",
          email: patient.email || "",
          direccion: patient.direccion || "",
          obra_social: patient.obra_social || "",
          nro_afiliado: patient.nro_afiliado || "",
          motivo_consulta: patient.motivo_consulta || "",
          foto_url: patient.foto_url || null,
        }
      : {
          nombre: "",
          dni: "",
          fecha_nacimiento: "",
          telefono: "",
          email: "",
          direccion: "",
          obra_social: "",
          nro_afiliado: "",
          motivo_consulta: "",
          foto_url: null,
        }
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <ImageUpload
            label="Foto de la paciente"
            value={form.foto_url}
            onChange={(v) => setForm((f) => ({ ...f, foto_url: v }))}
          />
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
          <Textarea
            label="Motivo de consulta / Antecedentes"
            value={form.motivo_consulta}
            onChange={set("motivo_consulta")}
            rows={3}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Btn>
        <Btn
          disabled={loading}
          onClick={() => {
            if (!form.nombre.trim() || !form.dni.trim()) {
              alert("Nombre y DNI son obligatorios");
              return;
            }
            onSave(form);
          }}
        >
          {loading ? "Guardando..." : patient ? "Guardar cambios" : "Crear paciente"}
        </Btn>
      </div>
    </div>
  );
}
