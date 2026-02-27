import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { C } from "../../utils/theme";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/pacientes", label: "Pacientes", icon: "🌸" },
  { to: "/citas", label: "Citas", icon: "📅" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 16px",
    borderRadius: 10,
    textDecoration: "none",
    color: isActive ? C.gold : C.muted,
    background: isActive ? "rgba(201,169,110,0.1)" : "transparent",
    borderLeft: isActive ? `3px solid ${C.gold}` : "3px solid transparent",
    fontWeight: isActive ? 600 : 400,
    fontSize: 14,
    transition: "all 0.15s",
  });

  const sidebarContent = (
    <div
      style={{
        width: 220,
        background: "#120f0b",
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.gold}, #8b5e3c)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          ⚕
        </div>
        <div>
          <div
            style={{
              color: C.gold,
              fontWeight: 700,
              fontSize: 16,
              fontFamily: "serif",
            }}
          >
            DermaClinic
          </div>
          <div style={{ color: C.muted, fontSize: 10 }}>Sistema de Gestión</div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={navLinkStyle}
            onClick={() => isMobile && setSidebarOpen(false)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>
          {user?.role === "admin" ? "👑 Administrador" : "⚕️ Doctor"}
        </div>
        <div
          style={{
            color: C.goldLight,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user?.nombre || user?.username}
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.muted,
            padding: "7px 12px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          ↩ Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'DM Sans', sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        input:focus, select:focus, textarea:focus { border-color: ${C.gold} !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      `}</style>

      {/* Desktop sidebar */}
      {!isMobile && sidebarContent}

      {/* Mobile: overlay sidebar */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 100,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              height: "100%",
              zIndex: 101,
              display: "flex",
            }}
          >
            {sidebarContent}
          </div>
        </>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Mobile header bar */}
        {isMobile && (
          <div
            style={{
              background: "#120f0b",
              borderBottom: `1px solid ${C.border}`,
              padding: "0 16px",
              height: 52,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: C.gold,
                fontSize: 20,
                cursor: "pointer",
                padding: 4,
              }}
            >
              ☰
            </button>
            <span style={{ color: C.gold, fontWeight: 700, fontFamily: "serif", fontSize: 15 }}>
              DermaClinic
            </span>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
