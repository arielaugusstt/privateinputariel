import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, TOKEN_KEY } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const onLogout = () => setUser(false);
    window.addEventListener("amk-logout", onLogout);
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(false);
    } else {
      api.get("/auth/me").then((r) => setUser(r.data)).catch((e) => {
        if (e.response?.status === 401) setUser(false);
        else setUser({ email: "offline", offline: true });
      });
    }
    return () => window.removeEventListener("amk-logout", onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(false);
  }, []);

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
