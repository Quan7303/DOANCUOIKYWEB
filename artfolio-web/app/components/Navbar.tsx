"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Moon, Plus, Sun, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useSocket } from "../hooks/useSocket";
import NotificationDropdown, {
  type SocketNotificationPayload,
} from "./NotificationDropdown";

const publicLinks = [
  { href: "/", label: "Trang chu" },
  { href: "/portfolios", label: "Kham pha" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, hasHydrated, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, isHydrated, accessToken, fetchMe, logout } =
    useAuthStore();
  const currentUser = isHydrated && isAuthenticated ? user : null;
  const signedIn = Boolean(currentUser);
  const createHref = signedIn
    ? "/dashboard?tab=upload"
    : `/login?next=${encodeURIComponent("/dashboard?tab=upload")}`;
  const themeLabel = hasHydrated && theme === "dark" ? "Che do sang" : "Che do toi";

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  const [latestSocketNotification, setLatestSocketNotification] =
    useState<SocketNotificationPayload | null>(null);

  const { socket } = useSocket({
    userId: currentUser?.id || currentUser?._id,
    enabled: signedIn,
  });

  useEffect(() => {
    if (!socket || !signedIn) return;

    function handleNotification(payload: SocketNotificationPayload) {
      setLatestSocketNotification(payload);
    }

    socket.on("send_notification", handleNotification);

    return () => {
      socket.off("send_notification", handleNotification);
    };
  }, [socket, signedIn]);

  useEffect(() => {
    if (!isHydrated || !accessToken || user) return;
    fetchMe();
  }, [accessToken, fetchMe, isHydrated, user]);

  const linkClass = (href: string) =>
    [
      "rounded-md px-3 py-2 text-sm font-semibold transition",
      isActive(pathname, href)
        ? "bg-surface-soft text-foreground"
        : "text-muted hover:bg-surface-soft hover:text-foreground",
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <nav className="app-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-bold">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-sm text-white">
            A
          </span>
          <span className="truncate">Artfolio</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          <Link href={createHref} className={linkClass("/dashboard")}>
            Dang tac pham
          </Link>
          {signedIn && (
            <Link href="/dashboard?tab=profile" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost h-10 w-10 px-0"
            aria-label={themeLabel}
            title={themeLabel}
          >
            {hasHydrated && theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden />
            ) : (
              <Moon className="h-4 w-4" aria-hidden />
            )}
          </button>

          {signedIn && accessToken && (
            <NotificationDropdown
              accessToken={accessToken}
              onUnreadCountChange={() => {}}
              socketNotification={latestSocketNotification}
            />
          )}

          <div className="hidden items-center gap-2 md:flex">
            {signedIn ? (
              <>
                <Link
                  href="/dashboard?tab=profile"
                  className="flex max-w-[190px] items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-surface-soft"
                >
                  {currentUser?.avatar && currentUser.avatar !== "default-avatar.png" ? (
                    <Image
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                      {currentUser?.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{currentUser?.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
                >
                  Dang xuat
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary">
                  Dang nhap
                </Link>
                <Link href="/signup" className="btn btn-primary">
                  Dang ky
                </Link>
              </>
            )}
          </div>

          <Link href={createHref} className="btn btn-primary h-10 w-10 px-0 md:hidden" aria-label="Dang tac pham">
            <Plus className="h-4 w-4" aria-hidden />
          </Link>

          <button
            type="button"
            className="btn btn-secondary h-10 w-10 px-0 md:hidden"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-label="Mo menu"
          >
            {isOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="app-container grid gap-1 py-3">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(link.href)}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={createHref}
              className={linkClass("/dashboard")}
              onClick={() => setIsOpen(false)}
            >
              Dang tac pham
            </Link>
            {signedIn && (
              <Link
                href="/dashboard?tab=profile"
                className={linkClass("/dashboard")}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}

            <div className="mt-2 border-t border-border pt-2">
              {signedIn ? (
                <>
                  <Link
                    href="/dashboard?tab=profile"
                    className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-semibold"
                    onClick={() => setIsOpen(false)}
                  >
                    {currentUser?.avatar && currentUser.avatar !== "default-avatar.png" ? (
                      <Image
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-5 w-5 text-primary" aria-hidden />
                    )}
                    <span className="truncate">{currentUser?.name}</span>
                  </Link>
                  <button
                    type="button"
                    className="w-full rounded-md bg-surface-soft px-3 py-3 text-left text-sm font-semibold text-danger"
                    onClick={handleLogout}
                  >
                    Dang xuat
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="btn btn-secondary w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Dang nhap
                  </Link>
                  <Link
                    href="/signup"
                    className="btn btn-primary w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Dang ky
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
