"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Image as ImageIcon, 
  Eye, 
  Heart, 
  ShieldAlert, 
  Search,
  CheckCircle2,
  Ban,
  Clock,
  RefreshCw,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { getApiUrl } from "../utils/apiConfig";
import StateBlock from "../components/StateBlock";

type SystemStats = {
  totalUsers: number;
  totalPortfolios: number;
  totalViews: number;
  totalLikes: number;
};

type UserData = {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: string;
  avatar: string;
  createdAt: string;
};

export default function AdminClient() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, accessToken } = useAuthStore();
  
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(getApiUrl("admin/stats"), {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const json = await res.json();
      setStats(json.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thống kê");
    } finally {
      setIsLoadingStats(false);
    }
  }, [accessToken]);

  const fetchUsers = useCallback(async (pageNum = 1, search = "") => {
    if (!accessToken) return;
    setIsLoadingUsers(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
        ...(search && { search })
      });
      const res = await fetch(getApiUrl(`admin/users?${queryParams}`), {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      setUsers(json.data);
      setTotalPages(json.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin" && accessToken) {
      const load = async () => {
        await Promise.resolve(); // forces async execution tick
        fetchStats();
        fetchUsers(1, "");
      };
      load();
    }
  }, [isAuthenticated, user, accessToken, fetchStats, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, searchQuery);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    if (!accessToken) return;
    const nextStatus = currentStatus === "ban" ? "active" : "ban";
    const confirmMessage = nextStatus === "ban" 
      ? "Bạn có chắc chắn muốn KHÓA tài khoản này?" 
      : "Bạn có chắc chắn muốn MỞ KHÓA tài khoản này?";
      
    if (!window.confirm(confirmMessage)) return;

    setActionLoadingId(userId);
    try {
      const res = await fetch(getApiUrl(`admin/users/${userId}/status`), {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ active: nextStatus })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update status");
      
      toast.success(`Đã ${nextStatus === 'ban' ? 'khóa' : 'mở khóa'} tài khoản thành công`);
      // Update local state
      setUsers(currents => currents.map(u => u._id === userId ? { ...u, active: nextStatus } : u));
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật trạng thái");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Prevent render if not authenticated admin
  if (!isHydrated || !isAuthenticated || user?.role !== "admin") {
    return <main className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  }

  const statCards = [
    { title: "Người dùng", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Tác phẩm", value: stats?.totalPortfolios || 0, icon: ImageIcon, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Lượt xem", value: stats?.totalViews || 0, icon: Eye, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Lượt thích", value: stats?.totalLikes || 0, icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <main className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-16 z-30">
        <div className="app-container flex h-20 items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted mt-1">Quản lý tổng quan hệ thống Artfolio</p>
          </div>
          <button 
            onClick={() => { fetchStats(); fetchUsers(page, searchQuery); }}
            className="btn btn-secondary gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
        </div>
      </div>

      <div className="app-container mt-8 grid gap-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl transition-all group-hover:scale-150 opacity-20 ${stat.bg.replace('/10', '')}`} />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted">{stat.title}</p>
                    {isLoadingStats ? (
                      <div className="h-8 w-16 bg-surface-soft animate-pulse rounded mt-2"></div>
                    ) : (
                      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                        {stat.value.toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Users Management */}
        <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border p-5 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> 
              Quản lý tài khoản
            </h2>
            
            <form onSubmit={handleSearch} className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input 
                type="text" 
                placeholder="Tìm email, tên..." 
                className="input pl-9 h-10 w-full bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="overflow-x-auto">
            {isLoadingUsers ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted" />
              </div>
            ) : users.length === 0 ? (
              <StateBlock type="empty" title="Không tìm thấy người dùng nào" description="Thử thay đổi từ khóa tìm kiếm của bạn." />
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-soft text-muted font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u._id} className="transition-colors hover:bg-surface-soft/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar && u.avatar !== "default-avatar.png" ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="h-10 w-10 rounded-full object-cover border border-border"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-foreground">{u.name}</div>
                            <div className="text-muted text-xs mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-surface-soft text-muted border border-border'
                        }`}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.active === 'active' && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Hoạt động
                          </span>
                        )}
                        {u.active === 'ban' && (
                          <span className="inline-flex items-center gap-1.5 text-danger text-xs font-bold">
                            <Ban className="h-3.5 w-3.5" /> Bị khóa
                          </span>
                        )}
                        {u.active === 'verify' && (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-bold">
                            <Clock className="h-3.5 w-3.5" /> Chờ xác thực
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            disabled={actionLoadingId === u._id}
                            onClick={() => handleToggleUserStatus(u._id, u.active)}
                            className={`btn btn-sm ${u.active === 'ban' ? 'btn-outline border-emerald-500 text-emerald-500 hover:bg-emerald-500/10' : 'btn-outline border-danger text-danger hover:bg-danger/10'}`}
                          >
                            {actionLoadingId === u._id ? <Loader2 className="h-3 w-3 animate-spin" /> : u.active === 'ban' ? 'Mở khóa' : 'Khóa'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-border p-4 flex items-center justify-center gap-2 bg-surface-soft/50">
              <button 
                disabled={page === 1}
                onClick={() => { setPage(p => p - 1); fetchUsers(page - 1, searchQuery); }}
                className="btn btn-secondary btn-sm"
              >
                Trước
              </button>
              <span className="text-sm font-medium px-4 text-muted">
                Trang {page} / {totalPages}
              </span>
              <button 
                disabled={page === totalPages}
                onClick={() => { setPage(p => p + 1); fetchUsers(page + 1, searchQuery); }}
                className="btn btn-secondary btn-sm"
              >
                Sau
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
