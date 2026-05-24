import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Trang chu" },
  { href: "/portfolios", label: "Kham pha" },
  { href: "/about", label: "Gioi thieu" },
  { href: "/contact", label: "Lien he" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Dang nhap" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="app-container grid gap-6 py-8 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm text-white">
              A
            </span>
            <span>Artfolio</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Nen tang portfolio sang tao danh cho designer, artist va photographer.
          </p>
          <p className="text-xs text-muted">
            INT1334 - CreativePortfolio - {year}
          </p>
        </div>

        <nav className="grid h-fit gap-2">
          <p className="text-xs font-bold uppercase text-muted">Dieu huong</p>
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

      <div className="border-t border-border">
        <div className="app-container flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>(c) {year} Artfolio. Du an hoc tap.</span>
          <span>Next.js - Tailwind CSS - TypeScript</span>
        </div>
      </div>
    </footer>
  );
}
