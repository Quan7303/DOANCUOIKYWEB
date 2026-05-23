import { create } from "zustand";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Đăng nhập thất bại");
    }
    
    // Lưu user vào state
    set({ user: data.user, isAuthenticated: true });
    // Token có thể lưu vào localStorage hoặc xử lý bởi interceptor (Task của TV2)
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
  },
  signup: async (userData) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Đăng ký thất bại");
    }
    
    // Sau khi đăng ký thành công, tuỳ logic có thể tự động đăng nhập hoặc không.
    // Ở đây theo contract thì signup trả về message, ta có thể tự động redirect ra form login.
    // Hoặc giả lập đăng nhập luôn nếu backend trả về access token
    if (data.accessToken && data.user) {
        set({ user: data.user, isAuthenticated: true });
        localStorage.setItem("accessToken", data.accessToken);
    }
  },
  logout: () => {
    localStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false });
  },
}));
