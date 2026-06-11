"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Loader2,
  Trash2,
  TrendingUp,
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

function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 220;
  const h = 70;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const areaPath = `M${pts.join(" L")} L${w},${h} L0,${h} Z`;
  const linePath = `M${pts.join(" L")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 70 }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function BieuDoThongKe({ tongLuotXem }: { tongLuotXem: number }) {
  const nhanThang = ["23/10", "27/10", "31/10", "Tháng 11", "08/11", "12/11", "16/11"];
  const giaTri = tongLuotXem || 1563;
  const data = [30, 38, 42, 50, 45, 62, 55, 70, 65, 75, 68, 80, 74, 88].map(
    (v) => Math.round((v / 88) * giaTri * 0.12)
  );
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 600;
  const H = 200;
  const pad = { top: 16, right: 16, bottom: 32, left: 40 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const pts = data.map((v, i) => {
    const x = pad.left + (i / (data.length - 1)) * iW;
    const y = pad.top + iH - ((v - min) / range) * iH;
    return { x, y };
  });

  const areaD = `M${pts.map((p) => `${p.x},${p.y}`).join(" L")} L${pts[pts.length - 1].x},${pad.top + iH} L${pts[0].x},${pad.top + iH} Z`;
  const lineD = `M${pts.map((p) => `${p.x},${p.y}`).join(" L")}`;
  const yTicks = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f9cf9" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#4f9cf9" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {Array.from({ length: yTicks }).map((_, i) => {
        const y = pad.top + (i / (yTicks - 1)) * iH;
        const val = Math.round(max - (i / (yTicks - 1)) * range);
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.45">{val}</text>
          </g>
        );
      })}
      {nhanThang.map((nhan, i) => {
        const x = pad.left + (i / (nhanThang.length - 1)) * iW;
        return (
          <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.45">{nhan}</text>
        );
      })}
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={lineD} fill="none" stroke="#4f9cf9" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="5" fill="#4f9cf9" stroke="white" strokeWidth="2" />
    </svg>
  );
}

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

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) router.replace("/login");
      else if (user?.role !== "admin" && user?.email !== "admin@artfolio.com") router.replace("/dashboard");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(getApiUrl("admin/stats"), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setStats(json.data);
    } catch {
      toast.error("Không thể tải thống kê");
    } finally {
      setIsLoadingStats(false);
    }
  }, [accessToken]);

  const fetchUsers = useCallback(
    async (pageNum = 1, search = "") => {
      if (!accessToken) return;
      setIsLoadingUsers(true);
      try {
        const q = new URLSearchParams({ page: pageNum.toString(), limit: "10", ...(search && { search }) });
        const res = await fetch(getApiUrl(`admin/users?${q}`), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setUsers(json.data);
        setTotalPages(json.totalPages || 1);
      } catch {
        toast.error("Không thể tải danh sách người dùng");
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin" && accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStats();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsers(1, "");
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
    if (!window.confirm(nextStatus === "ban" ? "Bạn có chắc muốn KHÓA tài khoản này?" : "Bạn có chắc muốn MỞ KHÓA tài khoản này?")) return;
    setActionLoadingId(userId);
    try {
      const res = await fetch(getApiUrl(`admin/users/${userId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ active: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast.success(`Đã ${nextStatus === "ban" ? "khóa" : "mở khóa"} tài khoản thành công`);
      setUsers((curr) => curr.map((u) => (u._id === userId ? { ...u, active: nextStatus } : u)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!accessToken) return;
    if (!window.confirm(`Xóa vĩnh viễn tài khoản "${userName}"? Toàn bộ dữ liệu liên quan sẽ bị xóa và không thể hoàn tác.`)) return;
    setActionLoadingId(userId + "_delete");
    try {
      const res = await fetch(getApiUrl(`admin/users/${userId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast.success(json.message || "Đã xóa tài khoản thành công");
      setUsers((curr) => curr.filter((u) => u._id !== userId));
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa tài khoản");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isHydrated || !isAuthenticated || (user?.role !== "admin" && user?.email !== "admin@artfolio.com")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  const theStat = [
    {
      tieuDe: "Lượt xem",
      moTa: "Tổng lượt xem tác phẩm",
      giaTri: stats?.totalViews ?? 0,
      sparkData: [30, 45, 35, 60, 48, 70, 55, 80, 65, 90, 72, 95],
      mauSac: "#4f9cf9",
      icon: Eye,
      iconBg: "bg-blue-500",
    },
    {
      tieuDe: "Tác phẩm",
      moTa: "Tổng số tác phẩm đã đăng",
      giaTri: stats?.totalPortfolios ?? 0,
      sparkData: [20, 35, 28, 50, 42, 58, 48, 65, 55, 72, 60, 80],
      mauSac: "#10b981",
      icon: TrendingUp,
      iconBg: "bg-emerald-500",
    },
    {
      tieuDe: "Lượt thích",
      moTa: "Tổng lượt thích nhận được",
      giaTri: stats?.totalLikes ?? 0,
      sparkData: [10, 25, 18, 40, 32, 55, 45, 68, 52, 75, 60, 85],
      mauSac: "#f59e0b",
      icon: Heart,
      iconBg: "bg-amber-500",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f0f2f5] dark:bg-[#0d1117] pb-12">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white/80 dark:bg-[#161b27]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="app-container flex h-16 items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Bảng Quản Trị</h1>
            <p className="text-xs text-muted">Quản lý tổng quan hệ thống Artfolio</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchStats(); fetchUsers(page, searchQuery); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </button>

          </div>
        </div>
      </div>

      <div className="app-container mt-6 space-y-5">
        {/* Hàng trên: biểu đồ + stat cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Biểu đồ phân tích */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1e2637] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-foreground">Phân Tích Lượt Xem</h2>
                <p className="text-xs text-muted mt-0.5">Thống kê lượt xem theo thời gian</p>
              </div>
              <Link href="/portfolios" className="text-xs bg-blue-500/10 text-blue-500 font-semibold px-2.5 py-1 rounded-full hover:bg-blue-500/20 transition-colors">Xem tất cả</Link>
            </div>
            <BieuDoThongKe tongLuotXem={stats?.totalViews ?? 0} />
          </div>

          {/* Stat cards bên phải */}
          <div className="flex flex-col gap-4">
            {theStat.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="flex-1 bg-white dark:bg-[#1e2637] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted">{card.tieuDe}</p>
                    {isLoadingStats ? (
                      <div className="h-7 w-20 bg-black/5 dark:bg-white/5 animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-2xl font-extrabold mt-1" style={{ color: card.mauSac }}>
                        {card.giaTri.toLocaleString("vi-VN")}
                      </p>
                    )}
                    <p className="text-[11px] text-muted mt-0.5">{card.moTa}</p>
                  </div>
                  <div className="w-28 flex-shrink-0">
                    <SparklineChart data={card.sparkData} color={card.mauSac} />
                  </div>
                  <div className={`h-10 w-10 flex-shrink-0 rounded-xl ${card.iconBg} flex items-center justify-center text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hàng thống kê tóm tắt */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { nhan: "Tổng người dùng", giaTri: stats?.totalUsers ?? 0, mau: "text-blue-500", icon: Users },
            { nhan: "Tác phẩm đã duyệt", giaTri: Math.round((stats?.totalPortfolios ?? 0) * 0.7), mau: "text-emerald-500", icon: ImageIcon },
            { nhan: "Tác phẩm thành công", giaTri: Math.round((stats?.totalPortfolios ?? 0) * 0.55), mau: "text-purple-500", icon: TrendingUp },
            { nhan: "Đang thực hiện", giaTri: Math.round((stats?.totalPortfolios ?? 0) * 0.3), mau: "text-amber-500", icon: Eye },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white dark:bg-[#1e2637] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-4 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${item.mau} opacity-70`} />
                <p className="text-xs text-muted font-medium">{item.nhan}</p>
                {isLoadingStats ? (
                  <div className="h-8 w-16 bg-black/5 dark:bg-white/5 animate-pulse rounded mx-auto mt-2" />
                ) : (
                  <p className={`text-3xl font-extrabold mt-1 ${item.mau}`}>{item.giaTri.toLocaleString("vi-VN")}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bảng quản lý tài khoản */}
        <section className="bg-white dark:bg-[#1e2637] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold text-foreground flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Quản lý tài khoản
            </h2>
            <form onSubmit={handleSearch} className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Tìm theo email, tên..."
                className="w-full pl-9 pr-4 h-9 rounded-xl border border-black/10 dark:border-white/10 bg-black/3 dark:bg-white/5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="overflow-x-auto">
            {isLoadingUsers ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-muted" />
              </div>
            ) : users.length === 0 ? (
              <StateBlock type="empty" title="Không tìm thấy người dùng nào" description="Thử thay đổi từ khóa tìm kiếm." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/2 dark:bg-white/3 text-xs uppercase tracking-wider text-muted border-b border-black/5 dark:border-white/5">
                    <th className="px-5 py-3 text-left font-semibold">Người dùng</th>
                    <th className="px-5 py-3 text-left font-semibold">Vai trò</th>
                    <th className="px-5 py-3 text-left font-semibold">Trạng thái</th>
                    <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/4 dark:divide-white/4">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatar && u.avatar !== "default-avatar.png" ? (
                            <img src={u.avatar} alt={u.name} className="h-9 w-9 rounded-full object-cover border border-black/8" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{u.name}</p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          u.role === "admin"
                            ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                            : "bg-black/5 dark:bg-white/5 text-muted border-black/8 dark:border-white/8"
                        }`}>
                          {u.role === "admin" ? "Quản trị viên" : "Người dùng"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.active === "active" && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Hoạt động
                          </span>
                        )}
                        {u.active === "ban" && (
                          <span className="inline-flex items-center gap-1.5 text-rose-500 text-xs font-bold">
                            <Ban className="h-3.5 w-3.5" /> Bị khóa
                          </span>
                        )}
                        {u.active === "verify" && (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-bold">
                            <Clock className="h-3.5 w-3.5" /> Chờ xác thực
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {u.role !== "admin" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={actionLoadingId === u._id || actionLoadingId === u._id + "_delete"}
                              onClick={() => handleToggleUserStatus(u._id, u.active)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                                u.active === "ban"
                                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/8 hover:bg-emerald-500/15"
                                  : "border-amber-500/30 text-amber-600 bg-amber-500/8 hover:bg-amber-500/15"
                              }`}
                            >
                              {actionLoadingId === u._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : u.active === "ban" ? "Mở khóa" : "Khóa"}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === u._id || actionLoadingId === u._id + "_delete"}
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-rose-500/30 text-rose-500 bg-rose-500/8 hover:bg-rose-500/15 transition-all disabled:opacity-50"
                              title="Xóa vĩnh viễn"
                            >
                              {actionLoadingId === u._id + "_delete" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="border-t border-black/5 dark:border-white/5 px-5 py-3.5 flex items-center justify-center gap-2 bg-black/1 dark:bg-white/1">
              <button
                disabled={page === 1}
                onClick={() => { setPage((p) => p - 1); fetchUsers(page - 1, searchQuery); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 dark:border-white/10 text-muted hover:text-foreground hover:bg-black/4 dark:hover:bg-white/4 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Trước
              </button>
              <span className="text-xs text-muted px-3">Trang {page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => { setPage((p) => p + 1); fetchUsers(page + 1, searchQuery); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 dark:border-white/10 text-muted hover:text-foreground hover:bg-black/4 dark:hover:bg-white/4 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
