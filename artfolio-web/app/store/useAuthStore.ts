"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "../types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEMO_ACCESS_TOKEN_PREFIX = "demo-access-token";

// Danh sách user mẫu để demo khi backend chưa hoàn thiện
const DEMO_USERS: (AuthUser & { password: string; portfolioIds: string[] })[] = [
  {
    id: "u1",
    name: "Nguyen Minh Anh",
    email: "minhanh@artfolio.vn",
    password: "Demo123",
    role: "user",
    avatar: "https://i.pravatar.cc/160?img=1",
    portfolioIds: ["aurora-brand-system"],
  },
  {
    id: "u2",
    name: "Tran Gia Bao",
    email: "giabao@artfolio.vn",
    password: "Demo123",
    role: "user",
    avatar: "https://i.pravatar.cc/160?img=2",
    portfolioIds: ["saigon-night-photo"],
  },
  {
    id: "u3",
    name: "Le Khanh Linh",
    email: "khanhlinh@artfolio.vn",
    password: "Demo123",
    role: "admin",
    avatar: "https://i.pravatar.cc/160?img=3",
    portfolioIds: ["finflow-dashboard"],
  },
];

type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

type AuthApiResponse = {
  accessToken?: string;
  token?: string;
  user?: AuthUser;
  data?: {
    accessToken?: string;
    token?: string;
    user?: AuthUser;
  };
  message?: string;
};

type AuthState = {
  // Giữ nguyên state cũ để không phá phần TV1
  user: AuthUser | null;
  isAuthenticated: boolean;

  // Bổ sung cho token management
  accessToken: string | null;
  isHydrated: boolean;
  isLoading: boolean;

  // Giữ nguyên chữ ký hàm cũ của TV1
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;

  // Bổ sung action mới cho TV2
  setHydrated: (value: boolean) => void;
  setAccessToken: (accessToken: string | null) => void;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  refreshAccessToken: () => Promise<string | null>;
  fetchMe: () => Promise<AuthUser | null>;
};

function extractAccessToken(data: AuthApiResponse | null): string | null {
  if (!data) return null;

  return (
    data.accessToken ||
    data.token ||
    data.data?.accessToken ||
    data.data?.token ||
    null
  );
}

function extractUser(data: AuthApiResponse | null): AuthUser | null {
  if (!data) return null;

  return data.user || data.data?.user || null;
}

async function safeJson(response: Response): Promise<AuthApiResponse | null> {
  try {
    return (await response.json()) as AuthApiResponse;
  } catch {
    return null;
  }
}

function findDemoUser(email: string, password: string) {
  return DEMO_USERS.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  );
}

function createDemoAccessToken(userId: string) {
  return `${DEMO_ACCESS_TOKEN_PREFIX}-${userId}-${Date.now()}`;
}

function isDemoAccessToken(accessToken: string | null) {
  return Boolean(accessToken?.startsWith(DEMO_ACCESS_TOKEN_PREFIX));
}

function removeSensitiveDemoFields(
  user: AuthUser & { password: string; portfolioIds: string[] }
): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
}

async function requestBackendLogin(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Đăng nhập thất bại.");
  }

  return data;
}

async function requestBackendSignup(payload: SignupPayload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Đăng ký thất bại.");
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

      setHydrated: (value) => {
        set({ isHydrated: value });
      },

      setAccessToken: (accessToken) => {
        set({
          accessToken,
          isAuthenticated: Boolean(accessToken || get().user),
        });
      },

      setAuth: (user, accessToken) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });

        try {
          // Ưu tiên gọi backend thật nếu đã có
          const data = await requestBackendLogin(email, password);

          const accessToken = extractAccessToken(data);
          const user = extractUser(data);

          if (!accessToken || !user) {
            throw new Error(
              "API login chưa trả về đủ user hoặc accessToken."
            );
          }

          set({
            user,
            accessToken,
            isAuthenticated: true,
          });
        } catch (error) {
          // Nếu backend chưa chạy thì fallback sang demo user,
          // giúp phần login/signup của TV1 vẫn demo được.
          const demoUser = findDemoUser(email, password);

          if (!demoUser) {
            throw error instanceof Error
              ? error
              : new Error("Email hoặc mật khẩu không đúng.");
          }

          const safeUser = removeSensitiveDemoFields(demoUser);

          set({
            user: safeUser,
            accessToken: createDemoAccessToken(safeUser.id),
            isAuthenticated: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (payload) => {
        set({ isLoading: true });

        try {
          // Ưu tiên gọi backend thật nếu đã có
          const data = await requestBackendSignup(payload);

          const accessToken = extractAccessToken(data);
          const user = extractUser(data);

          if (accessToken && user) {
            set({
              user,
              accessToken,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          // Nếu backend chưa chạy thì vẫn cho demo signup bằng local state.
          const existedDemoUser = DEMO_USERS.some(
            (user) =>
              user.email.toLowerCase() === payload.email.toLowerCase()
          );

          if (existedDemoUser) {
            throw new Error("Email này đã được đăng ký.");
          }

          const newUser: AuthUser = {
            id: `u${Date.now()}`,
            name: payload.name,
            email: payload.email,
            role: "user",
          };

          set({
            user: newUser,
            accessToken: createDemoAccessToken(newUser.id),
            isAuthenticated: true,
          });

          if (error instanceof Error) {
            console.warn(
              "Backend signup chưa sẵn sàng, đang dùng mock signup:",
              error.message
            );
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const currentToken = get().accessToken;

        // Demo token không cần refresh từ backend
        if (isDemoAccessToken(currentToken)) {
          return currentToken;
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/auth/refresh-token`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                Accept: "application/json",
              },
            }
          );

          const data = await safeJson(response);

          if (!response.ok) {
            get().clearAuth();
            return null;
          }

          const newAccessToken = extractAccessToken(data);

          if (!newAccessToken) {
            get().clearAuth();
            return null;
          }

          set({
            accessToken: newAccessToken,
            isAuthenticated: true,
          });

          return newAccessToken;
        } catch {
          get().clearAuth();
          return null;
        }
      },

      fetchMe: async () => {
        const currentUser = get().user;
        let currentToken = get().accessToken;

        // Nếu đang dùng demo token thì trả user hiện tại,
        // không gọi backend để tránh lỗi khi backend chưa hoàn thiện.
        if (isDemoAccessToken(currentToken)) {
          return currentUser;
        }

        if (!currentToken) {
          currentToken = await get().refreshAccessToken();
        }

        if (!currentToken) {
          return null;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${currentToken}`,
              Accept: "application/json",
            },
          });

          const data = await safeJson(response);

          if (response.status === 401) {
            const newToken = await get().refreshAccessToken();

            if (!newToken) {
              get().clearAuth();
              return null;
            }

            const retryResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
              method: "GET",
              credentials: "include",
              headers: {
                Authorization: `Bearer ${newToken}`,
                Accept: "application/json",
              },
            });

            const retryData = await safeJson(retryResponse);

            if (!retryResponse.ok) {
              get().clearAuth();
              return null;
            }

            const retryUser = extractUser(retryData);

            if (retryUser) {
              set({
                user: retryUser,
                isAuthenticated: true,
              });
            }

            return retryUser;
          }

          if (!response.ok) {
            return null;
          }

          const user = extractUser(data);

          if (user) {
            set({
              user,
              isAuthenticated: true,
            });
          }

          return user;
        } catch {
          return null;
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
    }
  )
);

// Helper lấy portfolioIds của user demo để dashboard dùng
export function getDemoPortfolioIds(userId: string): string[] {
  return DEMO_USERS.find((user) => user.id === userId)?.portfolioIds ?? [];
}