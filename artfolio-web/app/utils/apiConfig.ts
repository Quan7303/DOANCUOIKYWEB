function normalizeApiOrigin(value?: string) {
  const fallback = "http://localhost:5000";
  const raw = (value || fallback).replace(/\/+$/, "");

  return raw.endsWith("/api") ? raw.slice(0, -4) : raw;
}

const isServer = typeof window === "undefined";
const serverApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
const clientApiUrl = process.env.NEXT_PUBLIC_API_URL;

export const API_ORIGIN = normalizeApiOrigin(isServer ? serverApiUrl : clientApiUrl);
export const API_BASE_URL = `${API_ORIGIN}/api`;

export function getApiUrl(path = "") {
  const cleanPath = path.replace(/^\/+/, "");
  return cleanPath ? `${API_BASE_URL}/${cleanPath}` : API_BASE_URL;
}

export function getSocketUrl() {
  return normalizeApiOrigin(process.env.NEXT_PUBLIC_SOCKET_URL || API_ORIGIN);
}
