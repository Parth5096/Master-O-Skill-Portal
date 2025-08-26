import { API_BASE } from "../config";

export function getToken() { return localStorage.getItem("token"); }
export function setToken(t) { if (t) localStorage.setItem("token", t); }
export function clearToken() { localStorage.removeItem("token"); }

export async function api(path, { method="GET", data, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  const auth = token || getToken();
  if (auth) headers["Authorization"] = `Bearer ${auth}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers, body: data ? JSON.stringify(data) : undefined
  });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { message: text }; }
  if (!res.ok) {
    const err = new Error(json?.message || `HTTP ${res.status}`);
    err.status = res.status; err.body = json;
    throw err;
  }
  return json;
}

export const AuthAPI = {
  register: (p) => api("/auth/register", { method: "POST", data: p }),
  login:    (p) => api("/auth/login", { method: "POST", data: p }),
  me:       () => api("/auth/me")
};
export const UserAPI = { list: (q="") => api(`/users${q}`) };
export const SkillAPI = {
  list: (q="") => api(`/skills${q}`),
  create: (p) => api("/skills", { method:"POST", data:p }),
  update: (id, p) => api(`/skills/${id}`, { method:"PATCH", data:p }),
  remove: (id) => api(`/skills/${id}`, { method:"DELETE" })
};
export const QuestionAPI = {
  list: (q="") => api(`/questions${q}`),
  create: (p) => api("/questions", { method:"POST", data:p }),
  update: (id, p) => api(`/questions/${id}`, { method:"PATCH", data:p }),
  replaceOptions: (id, p) => api(`/questions/${id}/options`, { method:"PUT", data:p }),
  remove: (id) => api(`/questions/${id}`, { method:"DELETE" })
};
export const AttemptAPI = {
  start: (p) => api("/attempts/start", { method:"POST", data:p }),
  answer: (id, p) => api(`/attempts/${id}/answer`, { method:"POST", data:p }),
  submit: (id) => api(`/attempts/${id}/submit`, { method:"POST" }),
  list: (q="") => api(`/attempts${q}`)
};
export const ReportAPI = {
  userPerformance: (q="") => api(`/reports/user-performance${q}`),
  skillGap: (q="") => api(`/reports/skill-gap${q}`),
  time: (q="") => api(`/reports/time${q}`)
};
