"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Trash2, MessageSquare, Heart, UserPlus, FileText } from "lucide-react";
import { getApiUrl } from "../utils/apiConfig";

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "new_post"
  | "system";

type NotificationItem = {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type: NotificationType;
  portfolio?: {
    _id: string;
    title: string;
  };
  isRead: boolean;
  createdAt: string;
};

export type SocketNotificationPayload = {
  _id?: string;
  id?: string;
  recipient?: string;
  sender?: NotificationItem["sender"];
  senderId?: string;
  title?: string;
  type?: NotificationType;
  portfolio?: NotificationItem["portfolio"];
  portfolioId?: string;
  portfolioTitle?: string;
  createdAt?: string;
};

type NotificationsResponse = {
  status?: string;
  data?: NotificationItem[];
  unreadCount?: number;
};

type NotificationDropdownProps = {
  accessToken: string;
  onUnreadCountChange: (count: number) => void;
  socketNotification: SocketNotificationPayload | null;
};

export default function NotificationDropdown({
  accessToken,
  onUnreadCountChange,
  socketNotification,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl("notifications"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const json = (await res.json().catch(() => null)) as NotificationsResponse | null;

      if (res.ok && json?.status === "success") {
        const nextNotifications = json.data || [];
        const nextUnreadCount = json.unreadCount || 0;

        setNotifications(nextNotifications);
        setUnreadCount(nextUnreadCount);
        onUnreadCountChange(nextUnreadCount);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách thông báo:", error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, onUnreadCountChange]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    if (!accessToken) return;

    queueMicrotask(() => {
      void fetchNotifications();
    });
  }, [accessToken, fetchNotifications]);

  // Handle incoming socket notification
  useEffect(() => {
    if (!socketNotification) return;

    queueMicrotask(() => {
      const createdAt = socketNotification.createdAt || new Date().toISOString();

      const newNotification: NotificationItem = {
        _id: socketNotification._id || socketNotification.id || `notif-${createdAt}`,
        recipient: socketNotification.recipient || "",
        sender: socketNotification.sender || {
          _id: socketNotification.senderId || "",
          name: socketNotification.title?.split(" ")[0] || "Người dùng",
        },
        type: socketNotification.type || "system",
        portfolio:
          socketNotification.portfolio ||
          (socketNotification.portfolioId
            ? {
                _id: socketNotification.portfolioId,
                title: socketNotification.portfolioTitle || "Tác phẩm",
              }
            : undefined),
        isRead: false,
        createdAt,
      };

      setNotifications((current) => {
        if (current.some((item) => item._id === newNotification._id)) {
          return current;
        }

        return [newNotification, ...current];
      });

      setUnreadCount((previous) => {
        const next = previous + 1;
        onUnreadCountChange(next);
        return next;
      });
    });
  }, [socketNotification, onUnreadCountChange]);

  const toggleDropdown = () => {
    const nextOpen = !isOpen;

    setIsOpen(nextOpen);

    if (nextOpen) {
      setNowMs(Date.now());
      void fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(getApiUrl(`notifications/${id}/read`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => {
          const next = Math.max(0, prev - 1);
          onUnreadCountChange(next);
          return next;
        });
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(getApiUrl("notifications/read-all"), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        onUnreadCountChange(0);
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl(`notifications/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const wasUnread = !notifications.find(n => n._id === id)?.isRead;
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (wasUnread) {
          setUnreadCount(prev => {
            const next = Math.max(0, prev - 1);
            onUnreadCountChange(next);
            return next;
          });
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm("Bạn muốn xóa toàn bộ thông báo?");
    if (!confirmed) return;

    try {
      const res = await fetch(getApiUrl("notifications"), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        onUnreadCountChange(0);
      }
    } catch (error) {
      console.error("Lỗi khi xóa tất cả thông báo:", error);
    }
  };

  const renderNotificationText = (item: NotificationItem) => {
    const senderName = <span className="font-bold text-foreground">{item.sender?.name}</span>;
    const portfolioTitle = item.portfolio ? (
      <span className="font-semibold italic text-primary"> &ldquo;{item.portfolio.title}&rdquo;</span>
    ) : null;

    switch (item.type) {
      case "like":
        return <p className="text-sm">{senderName} đã thích tác phẩm{portfolioTitle} của bạn.</p>;
      case "comment":
        return <p className="text-sm">{senderName} đã bình luận tác phẩm{portfolioTitle} của bạn.</p>;
      case "follow":
        return <p className="text-sm">{senderName} đã bắt đầu theo dõi bạn.</p>;
      case "new_post":
        return <p className="text-sm">{senderName} đã đăng tác phẩm mới:{portfolioTitle}.</p>;
      default:
        return <p className="text-sm">{senderName} đã tương tác với bạn.</p>;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-danger" fill="currentColor" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-success" />;
      case "new_post":
        return <FileText className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-muted" />;
    }
  };

  const getNotificationLink = (item: NotificationItem) => {
    if (item.type === "follow") return `/profile/${item.sender?._id}`;
    return item.portfolio ? `/portfolio/${item.portfolio._id}` : "#";
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const currentTime = nowMs || date.getTime();
      const diffMs = Math.max(0, currentTime - date.getTime());
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="btn btn-ghost h-10 w-10 px-0 relative transition-transform active:scale-95"
        aria-label="Thông báo"
        title="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-soft/50">
            <h3 className="font-bold text-base">Thông báo</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="p-1 rounded-lg text-muted hover:bg-surface-soft hover:text-foreground transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="h-4 w-4" />
                  Đọc hết
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 rounded-lg text-muted hover:bg-danger/10 hover:text-danger transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Xóa tất cả thông báo"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa hết
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted">Không có thông báo nào</div>
            ) : (
              notifications.map(item => (
                <Link
                  key={item._id}
                  href={getNotificationLink(item)}
                  onClick={() => {
                    if (!item.isRead) handleMarkAsRead(item._id);
                    setIsOpen(false);
                  }}
                  className={`flex gap-3 p-4 transition-colors hover:bg-surface-soft/80 relative group ${
                    !item.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Indicator for unread */}
                  {!item.isRead && (
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                  )}

                  {/* Avatar & Icon badge */}
                  <div className="relative shrink-0 ml-1">
                    {item.sender?.avatar && item.sender.avatar !== "default-avatar.png" ? (
                      <img
                        src={item.sender.avatar}
                        alt={item.sender.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                        {item.sender?.name?.slice(0, 1).toUpperCase() || "U"}
                      </span>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-1 bg-surface border border-border rounded-full shadow-sm flex items-center justify-center">
                      {getNotificationIcon(item.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    {renderNotificationText(item)}
                    <span className="text-xs text-muted block mt-1">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>

                  {/* Individual Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(item._id, e)}
                    className="absolute right-3 top-4 p-1 rounded-md text-muted hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
