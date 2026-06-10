"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "../types/api";
import { API_ORIGIN } from "../utils/apiConfig";

const API_BASE_URL = API_ORIGIN;

type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

type VerifySignupOtpPayload = {
  email: string;
  otp: string;
};

type AuthApiResponse = {
  accessToken?: string;
  token?: string;
  user?: AuthUser;
  data?:
  | AuthUser
  | {
    accessToken?: string;
    token?: string;
    user?: AuthUser;
  };
  message?: string;
};

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  verifySignupOtp: (payload: VerifySignupOtpPayload) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<string | undefined>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setHydrated: (value: boolean) => void;
  setAccessToken: (accessToken: string | null) => void;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  refreshAccessToken: () => Promise<string | null>;
  fetchMe: () => Promise<AuthUser | null>;
};

function normalizeUser(user: AuthUser | null | undefined): AuthUser | null {
  if (!user) return null;

  const role = user.email === "admin@artfolio.com" ? "admin" : (user.role || "user");

  return {
    ...user,
    role,
    id: user.id || user._id || "",
  };
}

function getUserIdFromToken(accessToken: string | null) {
  if (!accessToken) return "";

  try {
    const [, payload] = accessToken.split(".");
    if (!payload) return "";

    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(normalizedPayload)) as {
      _id?: string;
      id?: string;
    };

    return decoded._id || decoded.id || "";
  } catch {
    return "";
  }
}

function extractAccessToken(data: AuthApiResponse | null): string | null {
  if (!data) return null;

  const nested = data.data && !("name" in data.data) ? data.data : null;

  return data.accessToken || data.token || nested?.accessToken || nested?.token || null;
}

function extractUser(data: AuthApiResponse | null): AuthUser | null {
  if (!data) return null;

  if (data.user) return normalizeUser(data.user);
  if (data.data && "name" in data.data) return normalizeUser(data.data);
  if (data.data && "user" in data.data) return normalizeUser(data.data.user);

  return null;
}

async function safeJson(response: Response): Promise<AuthApiResponse | null> {
  try {
    return (await response.json()) as AuthApiResponse;
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Khong ket noi duoc backend. Hay kiem tra API server roi thu lai.";
  }

  return error instanceof Error ? error.message : fallback;
}

async function requestJson(path: string, init: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Yeu cau that bai.");
  }

  return data;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      isHydrated: false,
      isLoading: false,

      setHydrated: (value) => set({ isHydrated: value }),

      setAccessToken: (accessToken) => {
        set({ accessToken, isAuthenticated: Boolean(accessToken && get().user) });
      },

      setAuth: (user, accessToken) => {
        set({ user: normalizeUser(user), accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      login: async (email, password) => {
        set({ isLoading: true });

        try {
          const data = await requestJson("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const accessToken = extractAccessToken(data);
          const user = extractUser(data);

          if (!accessToken || !user) {
            throw new Error("API dang nhap chua tra ve du user va accessToken.");
          }

          set({ user, accessToken, isAuthenticated: true });
        } catch (error) {
          throw new Error(getErrorMessage(error, "Dang nhap that bai."));
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (payload) => {
        set({ isLoading: true });

        try {
          await requestJson("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          throw new Error(getErrorMessage(error, "Dang ky that bai."));
        } finally {
          set({ isLoading: false });
        }
      },

      verifySignupOtp: async (payload) => {
        set({ isLoading: true });

        try {
          const data = await requestJson("/api/auth/verify-signup-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const accessToken = extractAccessToken(data);
          const user = extractUser(data);

          if (!accessToken || !user) {
            throw new Error("API xac thuc OTP chua tra ve du user va accessToken.");
          }

          set({ user, accessToken, isAuthenticated: true });
        } catch (error) {
          throw new Error(getErrorMessage(error, "Xac thuc OTP that bai."));
        } finally {
          set({ isLoading: false });
        }
      },

      resendSignupOtp: async (email) => {
        set({ isLoading: true });

        try {
          const data = await requestJson("/api/auth/resend-signup-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          return data?.message;
        } catch (error) {
          throw new Error(getErrorMessage(error, "Khong the gui lai OTP."));
        } finally {
          set({ isLoading: false });
        }
      },

      googleLogin: async (idToken) => {
        set({ isLoading: true });

        try {
          const data = await requestJson("/api/auth/google-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          const accessToken = extractAccessToken(data);
          const user = extractUser(data);

          if (!accessToken || !user) {
            throw new Error("API Google login chua tra ve du user va accessToken.");
          }

          set({ user, accessToken, isAuthenticated: true });
        } catch (error) {
          throw new Error(getErrorMessage(error, "Dang nhap Google that bai."));
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: { Accept: "application/json" },
          });
        } finally {
          get().clearAuth();
        }
      },

      refreshAccessToken: async () => {
        try {
          const data = await requestJson("/api/auth/refresh-token", {
            method: "POST",
          });

          const accessToken = extractAccessToken(data);

          if (!accessToken) {
            get().clearAuth();
            return null;
          }

          set({ accessToken, isAuthenticated: Boolean(get().user) });
          return accessToken;
        } catch {
          get().clearAuth();
          return null;
        }
      },

      fetchMe: async () => {
        let accessToken = get().accessToken;

        if (!accessToken) {
          accessToken = await get().refreshAccessToken();
        }

        if (!accessToken) return null;

        const userId =
          get().user?._id || get().user?.id || getUserIdFromToken(accessToken);

        if (!userId) return null;

        try {
          const data = await requestJson(`/api/users/${userId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const user = extractUser(data);

          if (!user) return null;

          set({ user, isAuthenticated: true });
          return user;
        } catch {
          const refreshedToken = await get().refreshAccessToken();

          if (!refreshedToken) return null;

          try {
            const retryUserId =
              get().user?._id ||
              get().user?.id ||
              getUserIdFromToken(refreshedToken);

            if (!retryUserId) return null;

            const retryData = await requestJson(`/api/users/${retryUserId}`, {
              method: "GET",
              headers: { Authorization: `Bearer ${refreshedToken}` },
            });
            const retryUser = extractUser(retryData);

            if (retryUser) {
              set({ user: retryUser, isAuthenticated: true });
            }

            return retryUser;
          } catch {
            get().clearAuth();
            return null;
          }
        }
      },
    }),
    {
      name: "artfolio-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
