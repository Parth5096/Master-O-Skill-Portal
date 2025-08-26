/* global __API_BASE__ */
// Prefer the compile-time constant; fall back to runtime window override; then default.
export const API_BASE =
  (typeof __API_BASE__ !== "undefined" && __API_BASE__) ||
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "http://localhost:4000/api";
