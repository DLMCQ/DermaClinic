import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { Avatar } from "../components/common/Avatar";
import { Btn } from "../components/common/Btn";
import { Modal } from "../components/common/Modal";
import { Toast } from "../components/common/Toast";
import { UserForm } from "../components/auth/UserForm";
import { C } from "../utils/theme";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState("list");

  const showToast = (message, type = "success") => setToast({ message, type });

  const loadUsuarios = useCallback(async () => {
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (e) {
      showToast("Error al cargar usuarios: " + e.message, "error");
    }
  }, []);

  useEffect(() => { loadUsuarios(); }, [loadUsuarios]);

  // CRUD Usuarios
  const saveUsuario = async (form) => {
    setLoading(true);
    try {
      if (editingUser) {
        const updated = await api.updateUsuario(editingUser.id, form);
        setUsuarios((us) =>
          us.map((u) => (u.id === editingUser.id ? updated : u))
        );
        showToast("Usuario actualizado");
      } else {
        const newU = await api.createUsuario(form);
        setUsuarios((us) =>
          [newU, ...us].sort((a, b) => a.email.localeCompare(b.email))
        );
        showToast("Usuario creado correctamente");
      }
      setModal(null);
      setEditingUser(null);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteUsuario = (id) => setConfirmDelete({ id });

  const doDeleteUsuario = async () => {
    setLoading(true);
    try {
      await api.deleteUsuario(confirmDelete.id);
      setUsuarios((us) => us.filter((u) => u.id !== confirmDelete.id));
      if (editingUser?.id === confirmDelete.id) {
        setEditingUser(null);
        setMobileView("list");
      }
      showToast("Usuario eliminado");
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
            display: isMobile && mobileView === "detail" ? "none" : "flex",
            flexDirection: "column",
            background: "#120f0b",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "18px 16px 14px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Btn style={{ flex: 1 }} onClick={() => setModal("newUser")}>
                + Nuevo Usuario
              </Btn>
            </div>
            <div style={{ color: C.muted, fontSize: 12 }}>
              {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}
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
            {usuarios.length === 0 ? (
              <div
                style={{
                  color: C.muted,
                  textAlign: "center",
                  padding: 40,
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                No hay usuarios registrados.
              </div>
            ) : (
              usuarios.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    setEditingUser(u);
                    if (isMobile) setMobileView("detail");
                  }}
                  style={{
                    background:
                      editingUser?.id === u.id
                        ? "rgba(201,169,110,0.1)"
                        : C.surface,
                    border: `1px solid ${editingUser?.id === u.id ? C.gold : C.border}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                  onMouseEnter={(e) => {
                    if (editingUser?.id !== u.id)
                      e.currentTarget.style.borderColor = `${C.gold}88`;
                  }}
                  onMouseLeave={(e) => {
                    if (editingUser?.id !== u.id)
                      e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  <Avatar name={u.nombre} size={48} />
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
                      {u.nombre}
                    </div>
                    <div style={{ color: C.goldLight, fontSize: 12, marginTop: 2 }}>
                      {u.username}
                    </div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>
                      Rol:{" "}
                      {u.role === "admin" ? "👑 Administrador" : "⚕️ Doctor"}
                    </div>
                  </div>
                  <Btn
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteUsuario(u.id);
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

          {editingUser ? (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 28,
              }}
            >
              <h2
                style={{ margin: "0 0 20px", color: C.gold, fontSize: 20, fontFamily: "serif" }}
              >
                Detalles del Usuario
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 20px",
                  marginBottom: 20,
                }}
              >
                {[
                  ["Nombre", editingUser.nombre],
                  ["Nombre de Usuario", editingUser.username],
                  ["Rol", editingUser.role === "admin" ? "👑 Administrador" : "⚕️ Doctor"],
                ].map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        color: C.muted,
                        fontSize: 12,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ color: C.goldLight, fontSize: 15, fontWeight: 500 }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => { setEditingUser(null); setMobileView("list"); }}>
                  Cerrar
                </Btn>
                <Btn onClick={() => setModal("editUser")}>✏️ Editar</Btn>
              </div>
            </div>
          ) : (
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
              <div style={{ fontSize: 64, marginBottom: 16, filter: "grayscale(1)" }}>👥</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.muted }}>
                Seleccione un usuario
              </div>
              <div style={{ fontSize: 13, color: C.border, marginTop: 6 }}>o cree uno nuevo</div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {modal === "newUser" && (
        <Modal title="Nuevo Usuario" onClose={() => setModal(null)}>
          <UserForm onSave={saveUsuario} onClose={() => setModal(null)} loading={loading} />
        </Modal>
      )}
      {modal === "editUser" && editingUser && (
        <Modal
          title="Editar Usuario"
          onClose={() => { setModal(null); }}
        >
          <UserForm
            user={editingUser}
            onSave={saveUsuario}
            onClose={() => { setModal(null); }}
            loading={loading}
          />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Confirmar eliminación" onClose={() => setConfirmDelete(null)}>
          <p style={{ color: C.goldLight, marginBottom: 24, lineHeight: 1.6 }}>
            ¿Eliminar este usuario? Esta acción no se puede deshacer.
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
              onClick={doDeleteUsuario}
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