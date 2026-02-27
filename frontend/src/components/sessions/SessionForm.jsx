import { useState } from "react";
import { Btn } from "../common/Btn";
import { Input, Textarea, Select, ImageUpload } from "../common/FormFields";
import { TRATAMIENTOS } from "../../utils/theme";

export function SessionForm({ session, onSave, onClose, loading }) {
  const [form, setForm] = useState(
    session
      ? {
          fecha: session.fecha || "",
          tratamiento: session.tratamiento || "",
          productos: session.productos || "",
          notas: session.notas || "",
          imagen_antes: session.imagen_antes || null,
          imagen_despues: session.imagen_despues || null,
        }
      : {
          fecha: new Date().toISOString().split("T")[0],
          tratamiento: "",
          productos: "",
          notas: "",
          imagen_antes: null,
          imagen_despues: null,
        }
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Fecha" value={form.fecha} onChange={set("fecha")} type="date" required />
        <Select
          label="Tratamiento"
          value={form.tratamiento}
          onChange={set("tratamiento")}
          options={TRATAMIENTOS}
          required
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <Textarea
            label="Productos / Materiales utilizados"
            value={form.productos}
            onChange={set("productos")}
            placeholder="Ej: Ácido glicólico 30%, crema hidratante SPF50..."
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Textarea
            label="Notas de la sesión"
            value={form.notas}
            onChange={set("notas")}
            placeholder="Observaciones, reacciones, indicaciones para la paciente..."
          />
        </div>
        <ImageUpload
          label="📷 Foto ANTES"
          value={form.imagen_antes}
          onChange={(v) => setForm((f) => ({ ...f, imagen_antes: v }))}
        />
        <ImageUpload
          label="📷 Foto DESPUÉS"
          value={form.imagen_despues}
          onChange={(v) => setForm((f) => ({ ...f, imagen_despues: v }))}
        />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Btn>
        <Btn
          disabled={loading}
          onClick={() => {
            if (!form.fecha || !form.tratamiento) {
              alert("Fecha y tratamiento son obligatorios");
              return;
            }
            onSave(form);
          }}
        >
          {loading ? "Guardando..." : session ? "Guardar cambios" : "Registrar sesión"}
        </Btn>
      </div>
    </div>
  );
}
