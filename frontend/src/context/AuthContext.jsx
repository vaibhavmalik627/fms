import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("fms_auth");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (auth) {
      localStorage.setItem("fms_auth", JSON.stringify(auth));
    } else {
      localStorage.removeItem("fms_auth");
    }
  }, [auth]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setAuth(data);
    return data;
  };

  const teacherLogin = async (email, name) => {
    const { data } = await api.post("/auth/teacher-login", { email, name });
    setAuth(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    setAuth(data);
    return data;
  };

  const logout = () => setAuth(null);

  const value = useMemo(
    () => ({
      auth,
      user: auth
        ? {
            id: auth._id,
            name: auth.name,
            email: auth.email,
            role: auth.role,
            profileImage: auth.profileImage || null,
            department: auth.department || "",
            subject: auth.subject || "",
          }
        : null,
      isAuthenticated: Boolean(auth?.token),
      login,
      teacherLogin,
      register,
      logout,
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
