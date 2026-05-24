import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { API_ORIGIN } from "./apiConfig";

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((request) => {
    if (error || !token) {
      request.reject(error);
      return;
    }

    request.resolve(token);
  });

  failedQueue = [];
}

function redirectToLogin() {
  if (typeof window === "undefined") return;

  const isLoginPage = window.location.pathname.includes("/login");

  if (!isLoginPage) {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }
}

function isRefreshTokenRequest(url?: string) {
  if (!url) return false;

  return (
    url.includes("/api/auth/refresh-token") ||
    url.includes("/auth/refresh-token")
  );
}

export const api = axios.create({
  baseURL: API_ORIGIN,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;

    if (
      !isUnauthorized ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      isRefreshTokenRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    isRefreshing = true;

    try {
      const newAccessToken =
        await useAuthStore.getState().refreshAccessToken();

      if (!newAccessToken) {
        throw new Error("Không thể refresh access token.");
      }

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      useAuthStore.getState().clearAuth();
      redirectToLogin();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
