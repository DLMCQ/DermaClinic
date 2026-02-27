import { useState } from "react";
import { Btn } from "../common/Btn";
import { Input, Select } from "../common/FormFields";

export function UserForm({ user, onSave, onClose, loading }) {
  const [form, setForm] = useState(
    user
      ? { email: user.email || "", nombre: user.nombre || "", role: user.role || "doctor", password: "" }
      : { email: "", nombre: "", role: "doctor", password: "" }
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Email" value={form.email} onChange={set("email")} type="email" required />
        <Input label="Nombre completo" value={form.nombre} onChange={set("nombre")} required />
        <Select
          label="Rol"
          value={form.role}
          onChange={set("role")}
          options={["doctor", "admin"]}
          required
        />
        <Input
          label={user ? "Nueva contraseña (opcional)" : "Contraseña"}
          value={form.password}
          onChange={set("password")}
          type="password"
          placeholder={user ? "Dejar en blanco para no cambiar" : "••••••••"}
          required={!user}
        />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Btn>
        <Btn
          disabled={loading}
          onClick={() => {
            if (!form.email.trim() || !form.nombre.trim()) {
              alert("Email y nombre son obligatorios");
              return;
            }
            if (!user && !form.password.trim()) {
              alert("Contraseña requerida para nuevo usuario");
              return;
            }
            onSave(form);
          }}
        >
          {loading ? "Guardando..." : user ? "Guardar cambios" : "Crear usuario"}
        </Btn>
      </div>
    </div>
  );
}
