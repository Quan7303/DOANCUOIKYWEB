"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/useAuthStore";

type NotificationPayload = {
  id?: string;
  title?: string;
  message: string;
  link?: string;
  type?: "comment" | "like" | "follow" | "system";
  createdAt?: string;
};

export default function NotificationToast() {
  const { user, isAuthenticated } = useAuthStore();
  const { socket } = useSocket({
    userId: user?.id,
    enabled: isAuthenticated,
  });

  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    function handleNotification(payload: NotificationPayload) {
      const notification: NotificationPayload = {
        ...payload,
        id: payload.id || `notification-${Date.now()}`,
        createdAt: payload.createdAt || new Date().toISOString(),
      };

      setNotifications((current) => [notification, ...current].slice(0, 3));
    }

    socket.on("send_notification", handleNotification);

    return () => {
      socket.off("send_notification", handleNotification);
    };
  }, [socket, isAuthenticated]);

  function dismiss(id?: string) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }

  if (notifications.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-50 grid w-[calc(100vw-2rem)] max-w-sm gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-2xl border border-border bg-background p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">
                {notification.title || "Thông báo mới"}
              </p>
              <p className="mt-1 text-sm text-muted">{notification.message}</p>

              {notification.link && (
                <Link
                  href={notification.link}
                  className="mt-3 inline-flex text-sm font-semibold text-primary"
                >
                  Xem chi tiết
                </Link>
              )}
            </div>

            <button
              type="button"
              className="rounded-full px-2 text-muted hover:bg-surface-soft hover:text-foreground"
              onClick={() => dismiss(notification.id)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}