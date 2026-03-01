import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../components/common/Avatar";
import { Btn } from "../components/common/Btn";
import { Modal } from "../components/common/Modal";
import { Toast } from "../components/common/Toast";
import { PatientForm } from "../components/patients/PatientForm";
import { SessionForm } from "../components/sessions/SessionForm";
import { C, inputStyle } from "../utils/theme";
import { formatDate, calcAge, generatePDF } from "../utils/helpers";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function PatientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const searchTimeout = useRef();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState("list");

  const showToast = (message, type = "success") => setToast({ message, type });

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

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadPatients(search || undefined), 300);
  }, [search, loadPatients]);

  const selectPatient = async (p) => {
    try {
      const data = await api.getPaciente(p.id);
      setSelected(data);
      if (isMobile) setMobileView("detail");
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
        setPatients((ps) =>
          [{ ...newP, total_sesiones: 0 }, ...ps].sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
          )
        );
        setSelected(newP);
        showToast("Paciente creada correctamente");
      } else {
        const updated = await api.updatePaciente(selected.id, form);
        setPatients((ps) =>
          ps.map((p) => (p.id === selected.id ? { ...p, ...updated } : p))
        );
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
        setPatients((ps) =>
          ps.map((p) =>
            p.id === selected.id
              ? { ...p, total_sesiones: (p.total_sesiones || 0) + 1 }
              : p
          )
        );
        showToast("Sesión registrada");
      } else {
        const updated = await api.updateSesion(editingSession.id, form);
        const updatedSesiones = selected.sesiones.map((s) =>
          s.id === editingSession.id ? updated : s
        );
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
      const updatedSesiones = selected.sesiones.filter(
        (s) => s.id !== confirmDelete.id
      );
      setSelected((sp) => ({ ...sp, sesiones: updatedSesiones }));
      setPatients((ps) =>
        ps.map((p) =>
          p.id === selected.id
            ? { ...p, total_sesiones: Math.max(0, (p.total_sesiones || 1) - 1) }
            : p
        )
      );
      showToast("Sesión eliminada");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: C.text }}>

      {/* Layout */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: isMobile ? "100%" : 340,
            borderRight: isMobile ? "none" : `1px solid ${C.border}`,
            borderBottom:
              isMobile && mobileView === "list" ? `1px solid ${C.border}` : "none",
            display:
              isMobile && mobileView === "detail" ? "none" : "flex",
            flexDirection: "column",
            background: C.surface,
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "18px 16px 14px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Buscar por nombre o DNI..."
                style={{ ...inputStyle, flex: 1, fontSize: 13, padding: "9px 12px" }}
              />
              <Btn onClick={() => setModal("newPatient")}>+ Nueva</Btn>
            </div>
            <div style={{ color: C.muted, fontSize: 12 }}>
              {patients.length} paciente{patients.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 12px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {pageLoading ? (
              <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>
                Conectando con el servidor...
              </div>
            ) : patients.length === 0 ? (
              <div
                style={{
                  color: C.muted,
                  textAlign: "center",
                  padding: 40,
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                {search
                  ? "Sin resultados para la búsqueda."
                  : "No hay pacientes registradas.\nHaga clic en '+ Nueva' para comenzar."}
              </div>
            ) : (
              patients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  style={{
                    background:
                      selected?.id === p.id
                        ? "rgba(201,169,110,0.1)"
                        : C.surface,
                    border: `1px solid ${selected?.id === p.id ? C.gold : C.border}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                  onMouseEnter={(e) => {
                    if (selected?.id !== p.id)
                      e.currentTarget.style.borderColor = `${C.gold}88`;
                  }}
                  onMouseLeave={(e) => {
                    if (selected?.id !== p.id)
                      e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  <Avatar url={p.foto_url} name={p.nombre} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: C.text,
                        fontWeight: 700,
                        fontSize: 15,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.nombre}
                    </div>
                    <div style={{ color: C.goldLight, fontSize: 12, marginTop: 2 }}>
                      DNI: {p.dni}
                      {p.fecha_nacimiento ? ` · ${calcAge(p.fecha_nacimiento)} años` : ""}
                    </div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>
                      {p.total_sesiones}{" "}
                      {p.total_sesiones != 1 ? "sesiones" : "sesión"}
                    </div>
                  </div>
                  <Btn
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePatient(p.id);
                    }}
                    style={{ padding: "5px 10px" }}
                  >
                    🗑
                  </Btn>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? 14 : 28,
            display: isMobile && mobileView === "list" ? "none" : "block",
          }}
        >
          {isMobile && mobileView === "detail" && (
            <button
              onClick={() => setMobileView("list")}
              style={{
                background: "none",
                border: "none",
                color: C.gold,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 16,
                padding: "6px 0",
                fontFamily: "inherit",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Volver a la lista
            </button>
          )}

          {!selected && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: C.border,
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, filter: "grayscale(1)" }}>🌸</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.muted }}>
                Seleccione una paciente
              </div>
              <div style={{ fontSize: 13, color: C.border, marginTop: 6 }}>
                o cree una nueva ficha
              </div>
            </div>
          )}

          {/* Ficha paciente */}
          {selected && (
            <>
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: isMobile ? 16 : 28,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 14 : 24,
                    alignItems: isMobile ? "center" : "flex-start",
                  }}
                >
                  <Avatar
                    url={selected.foto_url}
                    name={selected.nombre}
                    size={isMobile ? 80 : 100}
                  />
                  <div style={{ flex: 1, width: isMobile ? "100%" : "auto" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 10,
                        justifyContent: isMobile ? "center" : "flex-start",
                      }}
                    >
                      <h1
                        style={{
                          margin: 0,
                          fontSize: isMobile ? 20 : 26,
                          color: C.text,
                          fontWeight: 700,
                          fontFamily: "serif",
                          textAlign: isMobile ? "center" : "left",
                        }}
                      >
                        {selected.nombre}
                      </h1>
                      {calcAge(selected.fecha_nacimiento) && (
                        <span
                          style={{
                            background: "rgba(201,169,110,0.15)",
                            color: C.gold,
                            fontSize: 12,
                            padding: "3px 12px",
                            borderRadius: 20,
                            fontWeight: 600,
                          }}
                        >
                          {calcAge(selected.fecha_nacimiento)} años
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "5px 24px",
                      }}
                    >
                      {[
                        ["DNI", selected.dni],
                        ["Teléfono", selected.telefono],
                        ["Email", selected.email],
                        ["Dirección", selected.direccion],
                        ["Obra Social", selected.obra_social],
                        ["Nro. Afiliado", selected.nro_afiliado],
                        [
                          "Fecha Nac.",
                          selected.fecha_nacimiento
                            ? formatDate(selected.fecha_nacimiento)
                            : null,
                        ],
                      ]
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k}>
                            <span style={{ color: C.muted, fontSize: 12 }}>{k}: </span>
                            <span
                              style={{
                                color: C.goldLight,
                                fontSize: 13,
                                fontWeight: 500,
                              }}
                            >
                              {v}
                            </span>
                          </div>
                        ))}
                    </div>
                    {selected.motivo_consulta && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: "10px 16px",
                          background: C.bg,
                          borderRadius: 8,
                          borderLeft: `3px solid ${C.gold}`,
                        }}
                      >
                        <div
                          style={{
                            color: C.muted,
                            fontSize: 10,
                            marginBottom: 4,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Motivo de consulta
                        </div>
                        <div style={{ color: C.goldLight, fontSize: 14 }}>
                          {selected.motivo_consulta}
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "row" : "column",
                      gap: 9,
                      flexShrink: 0,
                      justifyContent: isMobile ? "center" : "flex-start",
                    }}
                  >
                    <Btn variant="ghost" size="sm" onClick={() => setModal("editPatient")}>
                      ✏️ Editar
                    </Btn>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/citas", { state: { paciente_id: selected.id, paciente_nombre: selected.nombre } })}
                    >
                      📅 Cita
                    </Btn>
                    <Btn
                      variant="success"
                      size="sm"
                      onClick={() => generatePDF(selected, formatDate, calcAge)}
                    >
                      📄 PDF
                    </Btn>
                  </div>
                </div>
              </div>

              {/* Sesiones */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: C.gold,
                    fontSize: isMobile ? 16 : 19,
                    fontFamily: "serif",
                  }}
                >
                  Historial de sesiones{" "}
                  <span style={{ color: C.muted, fontWeight: 400, fontSize: 14 }}>
                    ({selected.sesiones?.length || 0})
                  </span>
                </h2>
                <Btn onClick={() => setModal("newSession")}>+ Nueva sesión</Btn>
              </div>

              {!selected.sesiones?.length ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 52,
                    color: C.border,
                    border: `2px dashed ${C.border}`,
                    borderRadius: 14,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                  <div>Sin sesiones registradas aún</div>
                </div>
              ) : (
                [...(selected.sesiones || [])]
                  .sort((a, b) => b.fecha.localeCompare(a.fecha))
                  .map((s) => (
                    <div
                      key={s.id}
                      style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: 14,
                        padding: 22,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: C.text,
                              fontWeight: 700,
                              fontSize: 17,
                              fontFamily: "serif",
                            }}
                          >
                            {s.tratamiento}
                          </div>
                          <div style={{ color: C.gold, fontSize: 13, marginTop: 3 }}>
                            📅 {formatDate(s.fecha)}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSession(s);
                              setModal("editSession");
                            }}
                          >
                            ✏️
                          </Btn>
                          <Btn
                            variant="danger"
                            size="sm"
                            onClick={() => deleteSession(s.id)}
                          >
                            🗑
                          </Btn>
                        </div>
                      </div>
                      {s.productos && (
                        <div style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              color: C.muted,
                              fontSize: 10,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              marginBottom: 4,
                            }}
                          >
                            Productos utilizados
                          </div>
                          <div style={{ color: C.goldLight, fontSize: 14 }}>{s.productos}</div>
                        </div>
                      )}
                      {s.notas && (
                        <div style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              color: C.muted,
                              fontSize: 10,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              marginBottom: 4,
                            }}
                          >
                            Notas
                          </div>
                          <div style={{ color: C.goldLight, fontSize: 14 }}>{s.notas}</div>
                        </div>
                      )}
                      {(s.imagen_antes || s.imagen_despues) && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              s.imagen_antes && s.imagen_despues ? "1fr 1fr" : "1fr",
                            gap: 14,
                            marginTop: 14,
                          }}
                        >
                          {s.imagen_antes && (
                            <div>
                              <div
                                style={{
                                  color: C.muted,
                                  fontSize: 10,
                                  textTransform: "uppercase",
                                  letterSpacing: 1,
                                  marginBottom: 6,
                                }}
                              >
                                📷 Antes
                              </div>
                              <img
                                src={s.imagen_antes}
                                alt="antes"
                                style={{
                                  width: "100%",
                                  borderRadius: 8,
                                  maxHeight: 240,
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                          {s.imagen_despues && (
                            <div>
                              <div
                                style={{
                                  color: C.muted,
                                  fontSize: 10,
                                  textTransform: "uppercase",
                                  letterSpacing: 1,
                                  marginBottom: 6,
                                }}
                              >
                                📷 Después
                              </div>
                              <img
                                src={s.imagen_despues}
                                alt="despues"
                                style={{
                                  width: "100%",
                                  borderRadius: 8,
                                  maxHeight: 240,
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
              )}
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
          <PatientForm
            patient={selected}
            onSave={savePatient}
            onClose={() => setModal(null)}
            loading={loading}
          />
        </Modal>
      )}
      {modal === "newSession" && (
        <Modal title="Nueva Sesión" onClose={() => setModal(null)} wide>
          <SessionForm onSave={saveSession} onClose={() => setModal(null)} loading={loading} />
        </Modal>
      )}
      {modal === "editSession" && editingSession && (
        <Modal
          title="Editar Sesión"
          onClose={() => { setModal(null); setEditingSession(null); }}
          wide
        >
          <SessionForm
            session={editingSession}
            onSave={saveSession}
            onClose={() => { setModal(null); setEditingSession(null); }}
            loading={loading}
          />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Confirmar eliminación" onClose={() => setConfirmDelete(null)}>
          <p style={{ color: C.goldLight, marginBottom: 24, lineHeight: 1.6 }}>
            {confirmDelete.type === "patient"
              ? "¿Eliminar esta paciente y todo su historial de sesiones? Esta acción no se puede deshacer."
              : "¿Eliminar esta sesión? Esta acción no se puede deshacer."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Btn
              variant="ghost"
              onClick={() => setConfirmDelete(null)}
              disabled={loading}
            >
              Cancelar
            </Btn>
            <Btn
              variant="danger"
              disabled={loading}
              onClick={
                confirmDelete.type === "patient" ? doDeletePatient : doDeleteSession
              }
            >
              {loading ? "Eliminando..." : "Sí, eliminar"}
            </Btn>
          </div>
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}