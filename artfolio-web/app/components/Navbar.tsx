"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSelectedLayoutSegment,
} from "next/navigation";
import { Menu, Moon, Plus, Sun, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useSocket } from "../hooks/useSocket";
import NotificationDropdown, {
  type SocketNotificationPayload,
} from "./NotificationDropdown";

const publicLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/portfolios", label: "Khám phá" },
];

function isPortfolioDetailPath(pathname: string) {
  return (
    pathname.startsWith("/portfolio/") &&
    !pathname.startsWith("/portfolio/create") &&
    !pathname.startsWith("/portfolio/edit")
  );
}

function isActive(
  pathname: string,
  href: string,
  selectedSegment: string | null,
) {
  const isPortfolioDetail = isPortfolioDetailPath(pathname);

  if (href === "/") {
    return pathname === "/" || (isPortfolioDetail && selectedSegment === null);
  }

  if (href === "/portfolios") {
    return (
      pathname === "/portfolios" ||
      selectedSegment === "portfolios" ||
      (isPortfolioDetail && selectedSegment === "portfolio")
    );
  }

  if (href === "/create") {
    return pathname === "/create";
  }

  if (href === "/dashboard") {
    return (
      pathname.startsWith("/dashboard") ||
      (isPortfolioDetail && selectedSegment === "dashboard")
    );
  }

  if (href === "/admin") {
    return pathname.startsWith("/admin");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedSegment = useSelectedLayoutSegment();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, hasHydrated, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, isHydrated, accessToken, fetchMe, logout } =
    useAuthStore();
  const currentUser = isHydrated && isAuthenticated ? user : null;
  const signedIn = Boolean(currentUser);
  const profileHref = currentUser
    ? `/profile/${currentUser._id || currentUser.id}`
    : "/login";

  const createHref = signedIn
    ? "/create"
    : `/login?next=${encodeURIComponent("/create")}`;
  const themeLabel = hasHydrated && theme === "dark" ? "Chế độ sáng" : "Chế độ tối";

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  const handleCreateNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    setIsOpen(false);
    router.push(createHref);
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
      isActive(pathname, href, selectedSegment)
        ? "bg-primary text-white shadow-sm"
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
          <a
            href={createHref}
            className={linkClass("/create")}
            onClick={handleCreateNavigation}
          >
            Đăng tác phẩm
          </a>
          {signedIn && (
            <Link href="/dashboard?tab=profile" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
          )}
          {signedIn && (currentUser?.role === "admin" || currentUser?.email === "admin@artfolio.com") && (
            <Link href="/admin" className={linkClass("/admin")}>
              Quản trị
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
              onUnreadCountChange={() => { }}
              socketNotification={latestSocketNotification}
            />
          )}

          <div className="hidden items-center gap-2 md:flex">
            {signedIn ? (
              <>
                <Link
                  href={profileHref}
                  className="flex max-w-[190px] items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-surface-soft"
                >
                  {currentUser?.avatar && currentUser.avatar !== "default-avatar.png" ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
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
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary">
                  Đăng nhập
                </Link>
                <Link href="/signup" className="btn btn-primary">
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <a
            href={createHref}
            className="btn btn-primary h-10 w-10 px-0 md:hidden"
            onClick={handleCreateNavigation}
            aria-label="Đăng tác phẩm"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </a>

          <button
            type="button"
            className="btn btn-secondary h-10 w-10 px-0 md:hidden"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-label="Mở menu"
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
            <a
              href={createHref}
              className={linkClass("/create")}
              onClick={handleCreateNavigation}
            >
              Đăng tác phẩm
            </a>
            {signedIn && (
              <Link
                href="/dashboard?tab=profile"
                className={linkClass("/dashboard")}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {signedIn && (currentUser?.role === "admin" || currentUser?.email === "admin@artfolio.com") && (
              <Link
                href="/admin"
                className={linkClass("/admin")}
                onClick={() => setIsOpen(false)}
              >
                Quản trị
              </Link>
            )}

            <div className="mt-2 border-t border-border pt-2">
              {signedIn ? (
                <>
                  <Link
                    href={profileHref}
                    className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-semibold"
                    onClick={() => setIsOpen(false)}
                  >
                    {currentUser?.avatar && currentUser.avatar !== "default-avatar.png" ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="h-7 w-7 rounded-full object-cover"
                        referrerPolicy="no-referrer"
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
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="btn btn-secondary w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/signup"
                    className="btn btn-primary w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng ký
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
