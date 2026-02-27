import { createContext, useState, useEffect, useCallback } from "react";
import { api, setTokenExpiredCallback } from "../utils/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const login = useCallback(async (username, password) => {
    setAuthLoading(true);
    try {
      const response = await api.login(username, password);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));
      setUser(response.user);
      return response.user;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setTokenExpiredCallback(() => {
        setUser(null);
      });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
