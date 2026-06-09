"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import PortfolioModalShell from "./PortfolioModalShell";
import PortfolioDetailClient from "../portfolio/[id]/PortfolioDetailClient";
import type { PortfolioCategory, PortfolioSummary } from "../types/api";
import CustomSelect from "./CustomSelect";
import ColorPickerFilter from "./ColorPickerFilter";

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

function getPortfolioId(portfolio: PortfolioSummary) {
  return portfolio._id;
}

function PortfolioSkeleton() {
  return (
    <div className="masonry-item overflow-hidden rounded-xl border border-border bg-surface">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="grid gap-3 p-4">
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

function PortfolioCard({
  portfolio,
  index,
  onOpen,
}: {
  portfolio: PortfolioSummary;
  index: number;
  onOpen: (id: string) => void;
}) {
  const heights = [
    "aspect-[4/3]",
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[16/9]",
  ];

  const randomAspect = heights[index % heights.length];
  const authorName = portfolio.user?.name || "Unknown user";
  const authorInitial = authorName.slice(0, 1).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="masonry-item"
    >
      <button
        type="button"
        onClick={() => onOpen(getPortfolioId(portfolio))}
        className="group block h-full w-full text-left"
        aria-label={`Xem tác phẩm ${portfolio.title}`}
      >
        <article className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20">
          <div
            className={`relative w-full overflow-hidden bg-surface-soft ${randomAspect}`}
          >
            <Image
              src={portfolio.images?.[0] || "/next.svg"}
              alt={portfolio.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute inset-x-0 bottom-0 flex translate-y-4 items-end justify-between p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <div className="flex items-center gap-2">
                {portfolio.user?.avatar &&
                  portfolio.user.avatar !== "default-avatar.png" ? (
                  <img
                    src={portfolio.user.avatar}
                    alt={authorName}
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-white bg-primary text-[10px] font-bold text-white uppercase">
                    {authorInitial}
                  </span>
                )}

                <span className="text-sm font-semibold text-white drop-shadow-md">
                  {authorName}
                </span>
              </div>
            </div>

            <span className="absolute left-3 top-3 rounded-full glass bg-white/10 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              {categoryLabels[portfolio.category] || portfolio.category}
            </span>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <h2 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-primary">
              {portfolio.title}
            </h2>

            <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3 text-sm text-muted">
              <div className="flex flex-wrap gap-1">
                {portfolio.tags?.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-medium transition-colors group-hover:text-danger">
                  <Heart className="h-4 w-4" /> {portfolio.likesCount || 0}
                </span>
              </div>
            </div>
          </div>
        </article>
      </button>
    </motion.div>
  );
}

export default function PortfolioGrid({
  portfolios,
  isLoading = false,
  errorMessage,
}: PortfolioGridProps) {
  const [likeOverrides, setLikeOverrides] = useState<Record<string, number>>({});

  const displayPortfolios = useMemo(() => {
    return portfolios.map((portfolio) => {
      const portfolioId = getPortfolioId(portfolio);
      const likesCount = likeOverrides[portfolioId];

      if (typeof likesCount !== "number") {
        return portfolio;
      }

      return {
        ...portfolio,
        likesCount,
      };
    });
  }, [portfolios, likeOverrides]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PortfolioCategory | "all">("all");
  const [tag, setTag] = useState("all");

  useEffect(() => {
    function handlePortfolioLikeChanged(event: Event) {
      const customEvent = event as CustomEvent<{
        portfolioId?: string;
        likesCount?: number;
      }>;

      const portfolioId = customEvent.detail?.portfolioId;
      const likesCount = customEvent.detail?.likesCount;

      if (!portfolioId || typeof likesCount !== "number") return;

      setLikeOverrides((current) => ({
        ...current,
        [portfolioId]: likesCount,
      }));
    }

    window.addEventListener(
      "artfolio:portfolio-like-changed",
      handlePortfolioLikeChanged,
    );

    return () => {
      window.removeEventListener(
        "artfolio:portfolio-like-changed",
        handlePortfolioLikeChanged,
      );
    };
  }, []);
  const [selectedColor, setSelectedColor] = useState<string | "all">("all");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  const handleOpenPortfolio = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  };

  const handleClosePortfolio = () => {
    setSelectedPortfolioId(null);
  };

  const tags = useMemo(
    () =>
      Array.from(
        new Set(displayPortfolios.flatMap((portfolio) => portfolio.tags || [])),
      ).sort(),
    [displayPortfolios],
  );

  const colors = useMemo(() => {
    const allColors = displayPortfolios.flatMap((p) => p.colors || []);
    return Array.from(new Set(allColors.map((c) => c.toLowerCase()))).sort();
  }, [displayPortfolios]);

  const filtered = useMemo(() => {
    const q = normalize(query);

    return displayPortfolios.filter((portfolio) => {
      const matchesQuery =
        !q ||
        normalize(portfolio.title).includes(q) ||
        normalize(portfolio.user?.name || "").includes(q) ||
        Boolean(portfolio.tags && portfolio.tags.some((item) => normalize(item).includes(q)));

      const matchesCategory = category === "all" || portfolio.category === category;
      const matchesTag = tag === "all" || Boolean(portfolio.tags && portfolio.tags.includes(tag));
      const matchesColor = selectedColor === "all" || Boolean(portfolio.colors && portfolio.colors.map(c => c.toLowerCase()).includes(selectedColor));

      return matchesQuery && matchesCategory && matchesTag && matchesColor;
    });
  }, [category, displayPortfolios, query, tag, selectedColor]);

  const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));
  const tagOptions = [{ value: "all", label: "Tất cả Tags" }, ...tags.map(t => ({ value: t, label: `#${t}` }))];

  return (
    <>
      <div className="grid gap-8">
        <div className="glass sticky top-4 z-10 flex flex-col gap-4 rounded-2xl p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full flex-1 sm:max-w-xs">
            <input
              className="w-full rounded-xl border border-border/50 bg-surface/50 px-4 py-2.5 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm tác phẩm, tác giả..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <CustomSelect
              value={category}
              onChange={(val) => setCategory(val as PortfolioCategory | "all")}
              options={categoryOptions}
              minWidth="140px"
            />

            <CustomSelect
              value={tag}
              onChange={setTag}
              options={tagOptions}
              minWidth="160px"
            />

            <ColorPickerFilter
              colors={colors}
              selectedColor={selectedColor}
              onChange={setSelectedColor}
            />
          </div>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-danger/50 bg-danger/10 p-4 text-center text-sm font-semibold text-danger"
          >
            {errorMessage}
          </motion.div>
        )}

        {isLoading ? (
          <div className="masonry-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <PortfolioSkeleton key={index} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-surface/30 p-16 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-muted">
              <Eye className="h-8 w-8" />
            </div>

            <h2 className="text-xl font-bold">Không tìm thấy tác phẩm</h2>

            <p className="mt-2 max-w-sm text-sm text-muted">
              Thử thay đổi từ khóa hoặc xóa bớt bộ lọc để khám phá thêm nhiều
              portfolio tuyệt vời khác.
            </p>
          </motion.div>
        ) : (
          <motion.div layout className="masonry-grid">
            <AnimatePresence>
              {filtered.map((portfolio, index) => (
                <PortfolioCard
                  key={portfolio._id}
                  portfolio={portfolio}
                  index={index}
                  onOpen={handleOpenPortfolio}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {selectedPortfolioId && (
        <PortfolioModalShell onClose={handleClosePortfolio}>
          <PortfolioDetailClient
            key={selectedPortfolioId}
            portfolioId={selectedPortfolioId}
            mode="modal"
          />
        </PortfolioModalShell>
      )}
    </>
  );
}
