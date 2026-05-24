function normalizeApiOrigin(value?: string) {
  const fallback = "http://localhost:5000";
  const raw = (value || fallback).replace(/\/+$/, "");

  return raw.endsWith("/api") ? raw.slice(0, -4) : raw;
}

export const API_ORIGIN = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);
export const API_BASE_URL = `${API_ORIGIN}/api`;

export function getApiUrl(path = "") {
  const cleanPath = path.replace(/^\/+/, "");
  return cleanPath ? `${API_BASE_URL}/${cleanPath}` : API_BASE_URL;
}

export function getSocketUrl() {
  return normalizeApiOrigin(process.env.NEXT_PUBLIC_SOCKET_URL || API_ORIGIN);
}
