import { useState } from "react";
import { Btn } from "../common/Btn";
import { Input, Select } from "../common/FormFields";

export function UserForm({ user, onSave, onClose, loading }) {
  const [form, setForm] = useState(
    user
      ? { username: user.username || "", nombre: user.nombre || "", role: user.role || "doctor", password: "" }
      : { username: "", nombre: "", role: "doctor", password: "" }
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.username.trim() || !form.nombre.trim()) {
      alert("Usuario y nombre son obligatorios");
      return;
    }
    if (!user && !form.password.trim()) {
      alert("Contraseña requerida para nuevo usuario");
      return;
    }
    onSave(form);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Usuario" value={form.username} onChange={set("username")} type="text" required />
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
        <Btn disabled={loading} onClick={handleSubmit}>
          {loading ? "Guardando..." : user ? "Guardar cambios" : "Crear usuario"}
        </Btn>
      </div>
    </div>
  );
}