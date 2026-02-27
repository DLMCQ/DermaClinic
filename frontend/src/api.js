const BASE = process.env.REACT_APP_API_URL || "";

// Callback para cuando el token no se pueda renovar (será seteado por App.js)
let onTokenExpired = null;

export function setTokenExpiredCallback(callback) {
  onTokenExpired = callback;
}

async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh token");
    }

    // Guardar nuevo token
    localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    return data.accessToken;
  } catch (err) {
    console.error("Token refresh failed:", err);
    // Limpiar tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    // Llamar callback para redirigir al login
    if (onTokenExpired) {
      onTokenExpired();
    }
    throw err;
  }
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  // Agregar token si existe
  let token = localStorage.getItem("accessToken");
  if (token) {
    opts.headers.Authorization = `Bearer ${token}`;
  }

  if (body) opts.body = JSON.stringify(body);
  
  let res = await fetch(`${BASE}/api${path}`, opts);
  let data = await res.json();

  // Si recibimos 401, intentar refrescar el token y reintentar
  if (res.status === 401 && !path.includes("/auth/")) {
    try {
      token = await refreshAccessToken();
      
      // Reintentar la solicitud con el nuevo token
      opts.headers.Authorization = `Bearer ${token}`;
      if (body) opts.body = JSON.stringify(body);
      
      res = await fetch(`${BASE}/api${path}`, opts);
      data = await res.json();
    } catch (err) {
      throw new Error("Session expired. Please login again.");
    }
  }

  if (!res.ok) throw new Error(data.error || "Error en el servidor");
  return data;
}

export const api = {
  // Autenticación
  login: (username, password) => request("POST", "/auth/login", { username, password }),
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

  // Usuarios (solo admin)
  getUsuarios: () => request("GET", "/users"),
  createUsuario: (data) => request("POST", "/users", data),
  updateUsuario: (id, data) => request("PUT", `/users/${id}`, data),
  deleteUsuario: (id) => request("DELETE", `/users/${id}`),

  // Dashboard
  getDashboardStats: () => request("GET", "/dashboard/stats"),
  getDashboardActivity: (limit = 10) => request("GET", `/dashboard/activity?limit=${limit}`),

  // Citas (solo modo cloud)
  getAppointments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/appointments${q ? "?" + q : ""}`);
  },
  createAppointment: (data) => request("POST", "/appointments", data),
  updateAppointment: (id, data) => request("PUT", `/appointments/${id}`, data),
  deleteAppointment: (id) => request("DELETE", `/appointments/${id}`),
  completeAppointment: (id) => request("PATCH", `/appointments/${id}/complete`),
  cancelAppointment: (id) => request("PATCH", `/appointments/${id}/cancel`),
};
