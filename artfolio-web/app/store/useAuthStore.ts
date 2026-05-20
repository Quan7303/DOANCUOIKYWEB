"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../types/api";

// Danh sách user mẫu để demo (giả lập database)
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

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        // Giả lập network delay
        await new Promise((r) => setTimeout(r, 400));

        const found = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        );

        if (!found) {
          throw new Error("Email hoặc mật khẩu không đúng.");
        }

        const { password: _pw, portfolioIds: _ids, ...user } = found;
        set({ user, isAuthenticated: true });
      },

      signup: async ({ name, email, password }) => {
        await new Promise((r) => setTimeout(r, 400));

        const exists = DEMO_USERS.some(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );

        if (exists) {
          throw new Error("Email này đã được đăng ký.");
        }

        // Tạo user mới (chỉ tồn tại trong session vì demo)
        const newUser: AuthUser = {
          id: `u${Date.now()}`,
          name,
          email,
          role: "user",
        };
        set({ user: newUser, isAuthenticated: true });
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "artfolio-auth",
      // Chỉ lưu user và isAuthenticated, không lưu các hàm
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Helper lấy portfolioIds của user demo (để dashboard dùng)
export function getDemoPortfolioIds(userId: string): string[] {
  return DEMO_USERS.find((u) => u.id === userId)?.portfolioIds ?? [];
}
