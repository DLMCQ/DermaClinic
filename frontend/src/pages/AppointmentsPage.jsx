import { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { api } from "../utils/api";
import { Btn } from "../components/common/Btn";
import { Modal } from "../components/common/Modal";
import { Toast } from "../components/common/Toast";
import { Input, Textarea, Select } from "../components/common/FormFields";
import { C, TRATAMIENTOS } from "../utils/theme";

moment.locale("es");
const localizer = momentLocalizer(moment);

function toLocalISO(d) {
  const date = new Date(d);
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const ESTADO_COLORS = {
  pendiente: "#c9a96e",
  confirmada: "#5a9e6f",
  cancelada: "#e05a5a",
};

const ESTADOS = ["pendiente", "confirmada", "cancelada"];

const calendarStyles = `
  .rbc-calendar { background: transparent; color: #1a1410; font-family: 'DM Sans', sans-serif; }
  .rbc-header { background: #f5f0ea; border-color: #e0d5c5 !important; color: #7a6a58; padding: 10px 4px; font-size: 14px; font-weight: 600; }
  .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: #e0d5c5 !important; }
  .rbc-day-bg { border-color: #e0d5c5 !important; }
  .rbc-day-bg.rbc-today { background: transparent; }
  .rbc-off-range-bg { background: #f0ebe3; }
  .rbc-date-cell { color: #7a6a58; font-size: 14px; padding: 4px 6px; }
  .rbc-date-cell.rbc-now { color: #1a1410; font-weight: 700; text-decoration: underline; }
  .rbc-toolbar { margin-bottom: 16px; gap: 10px; flex-wrap: wrap; }
  .rbc-toolbar button { background: #f5f0ea; border: 1px solid #e0d5c5; color: #7a6a58; padding: 7px 14px; border-radius: 8px; font-family: inherit; cursor: pointer; font-size: 14px; }
  .rbc-toolbar button:hover { border-color: #c9a96e; color: #c9a96e; }
  .rbc-toolbar button.rbc-active { background: rgba(201,169,110,0.15); border-color: #c9a96e; color: #c9a96e; }
  .rbc-toolbar-label { color: #c9a96e; font-weight: 700; font-family: serif; font-size: 20px; }
  .rbc-event { border-radius: 6px !important; border: none !important; font-size: 13px; padding: 3px 8px; }
  .rbc-event-label { font-size: 12px; }
  .rbc-time-slot { border-color: #e0d5c5 !important; }
  .rbc-timeslot-group { border-color: #e0d5c5 !important; }
  .rbc-time-content { border-color: #e0d5c5 !important; }
  .rbc-time-header-content { border-color: #e0d5c5 !important; }
  .rbc-current-time-indicator { background: #c9a96e; }
  .rbc-show-more { color: #c9a96e; background: transparent; font-size: 13px; }
  .rbc-agenda-table { border-color: #e0d5c5; }
  .rbc-agenda-table td, .rbc-agenda-table th { border-color: #e0d5c5 !important; color: #1a1410; }
  .rbc-agenda-date-cell, .rbc-agenda-time-cell { color: #7a6a58; }
  .rbc-time-gutter .rbc-label { color: #7a6a58; font-size: 13px; }
`;

function AppointmentForm({ appointment, pacientes, onSave, onClose, loading }) {
  const today = new Date();
  const defaultDate = appointment?.fecha_hora
    ? toLocalISO(new Date(appointment.fecha_hora))
    : `${toLocalISO(today).slice(0, 10)}T09:00`;

  const [form, setForm] = useState({
    paciente_id: appointment?.paciente_id || "",
    fecha_hora: defaultDate,
    duracion_minutos: appointment?.duracion_minutos || 60,
    tratamiento_planeado: appointment?.tratamiento_planeado || "",
    estado: appointment?.estado || "pendiente",
    notas: appointment?.notas || "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: C.goldLight, fontSize: 11, marginBottom: 6, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Paciente *
            </label>
            <select
              value={form.paciente_id}
              onChange={set("paciente_id")}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: form.paciente_id ? C.text : C.muted, padding: "10px 14px", fontSize: 14, fontFamily: "inherit" }}
            >
              <option value="">Seleccionar paciente...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} — DNI: {p.dni}</option>
              ))}
            </select>
          </div>
        </div>
        <Input label="Fecha y hora" value={form.fecha_hora} onChange={set("fecha_hora")} type="datetime-local" required />
        <Input
          label="Duración (minutos)"
          value={form.duracion_minutos}
          onChange={set("duracion_minutos")}
          type="number"
        />
        <Select
          label="Tratamiento planeado"
          value={form.tratamiento_planeado}
          onChange={set("tratamiento_planeado")}
          options={TRATAMIENTOS}
        />
        <Select
          label="Estado"
          value={form.estado}
          onChange={set("estado")}
          options={ESTADOS}
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <Textarea label="Notas" value={form.notas} onChange={set("notas")} placeholder="Indicaciones, preparación..." />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
        <Btn
          disabled={loading}
          onClick={() => {
            if (!form.paciente_id || !form.fecha_hora) {
              alert("Paciente y fecha son obligatorios");
              return;
            }
            onSave(form);
          }}
        >
          {loading ? "Guardando..." : appointment ? "Guardar cambios" : "Crear cita"}
        </Btn>
      </div>
    </div>
  );
}

function AppointmentDetail({ appointment, onEdit, onCancel, onDelete, onClose, loading }) {
  const estado = appointment.estado;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20 }}>
        {[
          ["Paciente", appointment.paciente_nombre],
          ["Doctor", appointment.doctor_nombre || "—"],
          ["Fecha y hora", new Date(appointment.fecha_hora).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })],
          ["Duración", `${appointment.duracion_minutos} minutos`],
          ["Tratamiento", appointment.tratamiento_planeado || "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{k}</div>
            <div style={{ color: C.goldLight, fontSize: 14, fontWeight: 500 }}>{v}</div>
          </div>
        ))}
        <div>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Estado</div>
          <span style={{
            background: `${ESTADO_COLORS[estado]}20`,
            color: ESTADO_COLORS[estado],
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
          }}>
            {estado}
          </span>
        </div>
      </div>
      {appointment.notas && (
        <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, borderLeft: `3px solid ${C.gold}`, marginBottom: 20 }}>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Notas</div>
          <div style={{ color: C.goldLight, fontSize: 14 }}>{appointment.notas}</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>Cerrar</Btn>
        <Btn variant="ghost" size="sm" onClick={onEdit} disabled={loading}>✏️ Editar</Btn>
        {estado !== "cancelada" && (
          <Btn variant="danger" size="sm" onClick={onCancel} disabled={loading}>✕ Cancelar</Btn>
        )}
        <Btn variant="danger" size="sm" onClick={onDelete} disabled={loading}>🗑 Eliminar</Btn>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [selectedApt, setSelectedApt] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentView, setCurrentView] = useState(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCloudMode, setIsCloudMode] = useState(true);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const loadAppointments = useCallback(async () => {
    try {
      const data = await api.getAppointments();
      setAppointments(data);
      setIsCloudMode(true);
    } catch (e) {
      if (e.message?.includes("solo disponible en modo cloud")) {
        setIsCloudMode(false);
      } else {
        showToast("Error al cargar citas: " + e.message, "error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    api.getPacientes().then(setPacientes).catch(() => {});
  }, [loadAppointments]);

  const events = appointments.map((apt) => ({
    id: apt.id,
    title: `${apt.paciente_nombre}${apt.tratamiento_planeado ? " · " + apt.tratamiento_planeado : ""}`,
    start: new Date(apt.fecha_hora),
    end: new Date(new Date(apt.fecha_hora).getTime() + apt.duracion_minutos * 60000),
    resource: apt,
  }));

  const eventStyleGetter = (event) => {
    const color = ESTADO_COLORS[event.resource.estado] || C.gold;
    return {
      style: {
        backgroundColor: `${color}40`,
        border: `1px solid ${color}`,
        color: color,
        fontWeight: 600,
        boxShadow: `0 1px 4px ${color}30`,
      },
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedApt(event.resource);
    setModal("detail");
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedSlot(start);
    setModal("new");
  };

  const saveAppointment = async (form) => {
    setActionLoading(true);
    const formToSend = { ...form, fecha_hora: new Date(form.fecha_hora).toISOString() };
    try {
      if (modal === "new") {
        const newApt = await api.createAppointment(formToSend);
        setAppointments((prev) => [...prev, newApt]);
        showToast("Cita creada correctamente");
      } else {
        const updated = await api.updateAppointment(selectedApt.id, formToSend);
        setAppointments((prev) => prev.map((a) => (a.id === selectedApt.id ? updated : a)));
        showToast("Cita actualizada");
      }
      setModal(null);
      setSelectedApt(null);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const { appointment } = await api.cancelAppointment(selectedApt.id);
      setAppointments((prev) => prev.map((a) => (a.id === selectedApt.id ? { ...a, ...appointment } : a)));
      setSelectedApt((a) => ({ ...a, estado: "cancelada" }));
      showToast("Cita cancelada");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta cita? Esta acción no se puede deshacer.")) return;
    setActionLoading(true);
    try {
      await api.deleteAppointment(selectedApt.id);
      setAppointments((prev) => prev.filter((a) => a.id !== selectedApt.id));
      setModal(null);
      setSelectedApt(null);
      showToast("Cita eliminada");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isCloudMode) {
    return (
      <div style={{ padding: "60px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>☁️</div>
        <h2 style={{ color: C.gold, fontFamily: "serif", margin: "0 0 12px" }}>
          Calendario de citas
        </h2>
        <p style={{ color: C.muted, fontSize: 15, maxWidth: 400, margin: "0 auto" }}>
          El módulo de citas solo está disponible en modo cloud (PostgreSQL).
          En modo local no hay soporte para citas.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontSize: 16 }}>
        Cargando calendario...
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <style>{calendarStyles}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: C.gold, fontSize: 26, fontFamily: "serif", fontWeight: 700 }}>
            Calendario de Citas
          </h1>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>
            {appointments.length} cita{appointments.length !== 1 ? "s" : ""} · Click en un slot para crear, click en evento para ver detalles
          </p>
        </div>
        <Btn onClick={() => { setSelectedSlot(new Date()); setModal("new"); }}>
          + Nueva cita
        </Btn>
      </div>

      {/* Leyenda estados */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(ESTADO_COLORS).map(([estado, color]) => (
          <div key={estado} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            <span style={{ color: C.muted, fontSize: 12, textTransform: "capitalize" }}>{estado}</span>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div style={{ flex: 1, minHeight: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          defaultView={Views.WEEK}
          min={new Date(2000, 0, 1, 6, 0, 0)}
          max={new Date(2000, 0, 1, 22, 0, 0)}
          eventPropGetter={eventStyleGetter}
          messages={{
            today: "Hoy",
            previous: "‹",
            next: "›",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Sin citas en este período",
            showMore: (total) => `+${total} más`,
          }}
        />
      </div>

      {/* Modal nueva/editar cita */}
      {(modal === "new" || modal === "edit") && (
        <Modal
          title={modal === "new" ? "Nueva Cita" : "Editar Cita"}
          onClose={() => { setModal(null); setSelectedApt(null); }}
          wide
        >
          <AppointmentForm
            appointment={modal === "edit" ? selectedApt : selectedSlot ? { fecha_hora: toLocalISO(selectedSlot) } : null}
            pacientes={pacientes}
            onSave={saveAppointment}
            onClose={() => { setModal(null); setSelectedApt(null); }}
            loading={actionLoading}
          />
        </Modal>
      )}

      {/* Modal detalle */}
      {modal === "detail" && selectedApt && (
        <Modal
          title="Detalle de Cita"
          onClose={() => { setModal(null); setSelectedApt(null); }}
        >
          <AppointmentDetail
            appointment={selectedApt}
            onEdit={() => setModal("edit")}
            onCancel={handleCancel}
            onDelete={handleDelete}
            onClose={() => { setModal(null); setSelectedApt(null); }}
            loading={actionLoading}
          />
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}