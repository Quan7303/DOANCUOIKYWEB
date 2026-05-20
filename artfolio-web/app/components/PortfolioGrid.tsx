"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PortfolioCategory, PortfolioSummary } from "../types/api";

type PortfolioGridProps = {
  portfolios: PortfolioSummary[];
  isLoading?: boolean;
  errorMessage?: string;
};

const categoryLabels: Record<PortfolioCategory | "all", string> = {
  all: "Tất cả",
  design: "Design",
  art: "Art",
  photo: "Photo",
  "3d": "3D",
  other: "Other",
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function PortfolioSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="skeleton aspect-[4/3]" />
      <div className="grid gap-3 p-4">
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}

function PortfolioCard({ portfolio }: { portfolio: PortfolioSummary }) {
  return (
    <Link href={`/portfolio/${portfolio._id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-soft">
          <Image
            src={portfolio.images[0]}
            alt={portfolio.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm">
            {categoryLabels[portfolio.category]}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h2 className="line-clamp-2 text-base font-bold leading-snug">
              {portfolio.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{portfolio.user.name}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {portfolio.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm text-muted">
            <div className="flex gap-1.5" aria-label="Bảng màu">
              {portfolio.colors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>{portfolio.likesCount.toLocaleString("vi-VN")} lượt thích</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function PortfolioGrid({
  portfolios,
  isLoading = false,
  errorMessage,
}: PortfolioGridProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PortfolioCategory | "all">("all");
  const [tag, setTag] = useState("all");
  const [color, setColor] = useState("all");

  const tags = useMemo(
    () => Array.from(new Set(portfolios.flatMap((portfolio) => portfolio.tags))).sort(),
    [portfolios],
  );

  const colors = useMemo(
    () => Array.from(new Set(portfolios.flatMap((portfolio) => portfolio.colors))).sort(),
    [portfolios],
  );

  const filtered = useMemo(() => {
    const q = normalize(query);

    return portfolios.filter((portfolio) => {
      const matchesQuery =
        !q ||
        normalize(portfolio.title).includes(q) ||
        normalize(portfolio.user.name).includes(q) ||
        portfolio.tags.some((item) => normalize(item).includes(q));
      const matchesCategory = category === "all" || portfolio.category === category;
      const matchesTag = tag === "all" || portfolio.tags.includes(tag);
      const matchesColor = color === "all" || portfolio.colors.includes(color);

      return matchesQuery && matchesCategory && matchesTag && matchesColor;
    });
  }, [category, color, portfolios, query, tag]);

  return (
    <div className="grid gap-5">
      <div className="surface grid gap-3 rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <label className="field">
            <span className="label">Tìm kiếm</span>
            <input
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tên tác phẩm, tác giả, tag"
            />
          </label>

          <label className="field">
            <span className="label">Danh mục</span>
            <select
              className="input"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as PortfolioCategory | "all")
              }
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Tag</span>
            <select
              className="input"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
            >
              <option value="all">Tất cả</option>
              {tags.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Màu</span>
            <select
              className="input"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            >
              <option value="all">Tất cả</option>
              {colors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-danger bg-surface p-4 text-sm font-semibold text-danger">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <PortfolioSkeleton key={index} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <h2 className="text-lg font-bold">Không có tác phẩm phù hợp</h2>
          <p className="mt-2 text-sm text-muted">
            Đổi bộ lọc hoặc xóa từ khóa để xem thêm portfolio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((portfolio) => (
            <PortfolioCard key={portfolio._id} portfolio={portfolio} />
          ))}
        </div>
      )}
    </div>
  );
}
