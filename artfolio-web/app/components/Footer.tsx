import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/portfolios", label: "Khám phá" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Đăng nhập" },
  { href: "/signup", label: "Đăng ký" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="app-container grid gap-6 py-8 sm:grid-cols-[1fr_auto]">
        {/* Brand */}
        <div className="grid gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-white">
              A
            </span>
            <span>Artfolio</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Nền tảng portfolio sáng tạo dành cho cộng đồng designer, artist và photographer Việt Nam.
          </p>
          <p className="text-xs text-muted">
            Môn INT1334 · CreativePortfolio Frontend Handoff · {year}
          </p>
        </div>

        {/* Nav */}
        <nav className="grid h-fit gap-2">
          <p className="text-xs font-bold uppercase text-muted">Điều hướng</p>
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="app-container flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} Artfolio. Dự án học thuật – không phát hành thương mại.</span>
          <span>Built with Next.js · Tailwind CSS · TypeScript</span>
        </div>
      </div>
    </footer>
  );
}
