const BASE = process.env.REACT_APP_API_URL || "";

async function request(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  // Agregar token si existe
  const token = localStorage.getItem("accessToken");
  if (token) {
    opts.headers.Authorization = `Bearer ${token}`;
  }

  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error en el servidor");
  return data;
}

export const api = {
  // Autenticación
  login: (email, password) => request("POST", "/auth/login", { email, password }),
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  // Pacientes
  getPacientes: (q) => request("GET", q ? `/pacientes?q=${encodeURIComponent(q)}` : "/pacientes"),
  getPaciente: (id) => request("GET", `/pacientes/${id}`),
  createPaciente: (data) => request("POST", "/pacientes", data),
  updatePaciente: (id, data) => request("PUT", `/pacientes/${id}`, data),
  deletePaciente: (id) => request("DELETE", `/pacientes/${id}`),

  // Sesiones
  createSesion: (data) => request("POST", "/sesiones", data),
  updateSesion: (id, data) => request("PUT", `/sesiones/${id}`, data),
  deleteSesion: (id) => request("DELETE", `/sesiones/${id}`),
};
