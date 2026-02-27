import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { Avatar } from "../components/common/Avatar";
import { Toast } from "../components/common/Toast";
import { C } from "../utils/theme";
import { formatDate } from "../utils/helpers";

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "22px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `${color}18`,
          border: `1px solid ${color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ color: color, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
          {value ?? "—"}
        </div>
        {sub != null && (
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
            +{sub} este mes
          </div>
        )}
      </div>
    </div>
  );
}

function TreatmentBar({ tratamiento, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{tratamiento}</span>
        <span style={{ color: C.gold, fontSize: 13, fontWeight: 700 }}>{count}</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${C.gold}, #a07848)`,
            borderRadius: 3,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = "error") => setToast({ message: msg, type });

  useEffect(() => {
    async function loadAll() {
      try {
        const [s, a] = await Promise.all([
          api.getDashboardStats(),
          api.getDashboardActivity(8),
        ]);
        setStats(s);
        setActivity(a);
      } catch (e) {
        showToast("Error al cargar el dashboard: " + e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontSize: 16 }}>
        Cargando estadísticas...
      </div>
    );
  }

  const maxTreatment = stats?.topTreatments?.[0]?.count || 1;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, color: C.gold, fontSize: 26, fontFamily: "serif", fontWeight: 700 }}>
          Dashboard
        </h1>
        <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 14 }}>
          Resumen general del sistema
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Total pacientes"
          value={stats?.totalPatients}
          sub={stats?.newPatientsThisMonth}
          color={C.gold}
          icon="🌸"
        />
        <StatCard
          label="Total sesiones"
          value={stats?.totalSessions}
          sub={stats?.sessionsThisMonth}
          color="#7eb8f7"
          icon="💉"
        />
        <StatCard
          label="Próximas citas"
          value={stats?.upcomingAppointments}
          color={C.success}
          icon="📅"
        />
        <StatCard
          label="Sesiones este mes"
          value={stats?.sessionsThisMonth}
          color="#c084fc"
          icon="📋"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top tratamientos */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h2 style={{ margin: "0 0 20px", color: C.gold, fontSize: 16, fontFamily: "serif" }}>
            Top tratamientos
          </h2>
          {stats?.topTreatments?.length ? (
            stats.topTreatments.map((t) => (
              <TreatmentBar
                key={t.tratamiento}
                tratamiento={t.tratamiento}
                count={t.count}
                max={maxTreatment}
              />
            ))
          ) : (
            <div style={{ color: C.muted, fontSize: 13 }}>Sin datos aún</div>
          )}
        </div>

        {/* Pacientes recientes */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h2 style={{ margin: "0 0 20px", color: C.gold, fontSize: 16, fontFamily: "serif" }}>
            Pacientes recientes
          </h2>
          {stats?.recentPatients?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stats.recentPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate("/pacientes")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    padding: "8px 10px",
                    borderRadius: 10,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,169,110,0.07)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar url={p.foto_path || p.foto_url} name={p.nombre} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.text, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.nombre}
                    </div>
                    <div style={{ color: C.muted, fontSize: 11 }}>
                      DNI: {p.dni}
                    </div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 11, flexShrink: 0 }}>
                    {formatDate(p.created_at || p.creado_en)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: C.muted, fontSize: 13 }}>Sin pacientes aún</div>
          )}
        </div>

        {/* Actividad reciente */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            gridColumn: "1 / -1",
          }}
        >
          <h2 style={{ margin: "0 0 20px", color: C.gold, fontSize: 16, fontFamily: "serif" }}>
            Actividad reciente
          </h2>
          {activity.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activity.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 0",
                    borderBottom: i < activity.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: C.gold,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>
                      {a.paciente_nombre}
                    </span>
                    <span style={{ color: C.muted, fontSize: 13 }}> — {a.tratamiento}</span>
                  </div>
                  <div style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>
                    {formatDate(a.fecha)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: C.muted, fontSize: 13 }}>Sin actividad registrada</div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
