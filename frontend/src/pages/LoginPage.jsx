import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Btn } from "../components/common/Btn";
import { C, inputStyle } from "../utils/theme";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Usuario y contraseña requeridos");
      return;
    }
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
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
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
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
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nombre_usuario"
              disabled={authLoading}
              style={{ ...inputStyle, opacity: authLoading ? 0.5 : 1 }}
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
              disabled={authLoading}
              style={{ ...inputStyle, opacity: authLoading ? 0.5 : 1 }}
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
            disabled={authLoading}
            style={{ width: "100%", fontSize: 15, fontWeight: 700, padding: "14px 20px" }}
          >
            {authLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
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
          admin / password
        </div>
      </div>
    </div>
  );
}
