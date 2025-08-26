import { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI, setToken as saveToken, getToken, clearToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) return setReady(true);
    AuthAPI.me()
      .then((r) => setUser(r.user || null))
      .catch(() => { clearToken(); setUser(null); })
      .finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const r = await AuthAPI.login({ email, password });
    saveToken(r.token);
    setUser(r.user);
    return r;
  }
  async function register(fullName, email, password) {
    const r = await AuthAPI.register({ fullName, email, password });
    saveToken(r.token);
    setUser(r.user);
    return r;
  }
  function logout() { clearToken(); setUser(null); }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() { return useContext(AuthContext); }
