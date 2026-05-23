"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/portfolios", label: "Khám phá" },
  { href: "/portfolio/create", label: "Đăng tác phẩm" },
];

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, hasHydrated, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const themeLabel = hasHydrated && theme === "dark" ? "Chế độ sáng" : "Chế độ tối";

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/");
  };

  const allLinks = isAuthenticated
    ? [...navLinks, { href: "/dashboard", label: "Dashboard" }]
    : navLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <nav className="app-container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-white">
            A
          </span>
          <span>Artfolio</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-soft hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost h-10 w-10 px-0"
            aria-label={themeLabel}
            title={themeLabel}
          >
            <span aria-hidden>{hasHydrated && theme === "dark" ? "☼" : "☾"}</span>
          </button>

          {/* Auth section – desktop */}
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && user ? (
              <>
                {/* Avatar + tên */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-surface-soft"
                >
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                      {user.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate">{user.name}</span>
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

          {/* Hamburger button – mobile */}
          <button
            type="button"
            className="btn btn-secondary h-10 w-10 px-0 md:hidden"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-label="Mở menu"
          >
            <span aria-hidden>{isOpen ? "✕" : "≡"}</span>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="app-container grid gap-1 py-3">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg bg-surface-soft px-3 py-3 text-sm font-semibold"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-1 border-t border-border pt-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                        {user.name.slice(0, 1)}
                      </span>
                    )}
                    <span className="text-sm font-semibold">{user.name}</span>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-lg bg-surface-soft px-3 py-3 text-left text-sm font-semibold text-danger"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block rounded-lg bg-surface-soft px-3 py-3 text-sm font-semibold"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/signup"
                    className="mt-1 block rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
