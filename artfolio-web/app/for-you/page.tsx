"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart, Shuffle, Users, Tag } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import api from "../utils/api";
import { normalizePortfolio, type RawPortfolio } from "../data/portfolios";
import type { PortfolioSummary } from "../types/api";
import PortfolioModalShell from "../components/PortfolioModalShell";
import PortfolioDetailClient from "../portfolio/[id]/PortfolioDetailClient";
import StateBlock from "../components/StateBlock";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type FollowingUser = {
  _id: string;
  name: string;
  avatar?: string;
};

type Sections = {
  followingPosts: RawPortfolio[];
  tagPosts: RawPortfolio[];
  randomPosts: RawPortfolio[];
  likedTags: string[];
  followingUsers: FollowingUser[];
};

type FeedMeta = {
  followingCount: number;
  likedTagCount: number;
  hasRandom: boolean;
};

type FeedResponse = {
  sections: Sections;
  meta: FeedMeta;
};

// ─── Mini card (dùng nội bộ trong trang này) ──────────────────────────────────

function MiniPortfolioCard({
  portfolio,
  index,
  onOpen,
}: {
  portfolio: PortfolioSummary;
  index: number;
  onOpen: (id: string) => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      onClick={() => onOpen(portfolio._id)}
      className="group block w-full text-left"
      aria-label={`Xem tác phẩm ${portfolio.title}`}
    >
      <article className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-soft">
          <Image
            src={portfolio.images?.[0] || "/next.svg"}
            alt={portfolio.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Author overlay */}
          <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center gap-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {portfolio.user?.avatar ? (
              <img
                src={portfolio.user.avatar}
                alt={portfolio.user.name}
                className="h-6 w-6 rounded-full border border-white object-cover"
              />
            ) : (
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white bg-primary text-[9px] font-bold uppercase text-white">
                {portfolio.user?.name?.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-xs font-semibold text-white drop-shadow">
              {portfolio.user?.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-primary">
            {portfolio.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted">
            <div className="flex flex-wrap gap-1">
              {portfolio.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="text-muted/70">
                  #{tag}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 font-medium">
              <Heart className="h-3 w-3" />
              {portfolio.likesCount || 0}
            </span>
          </div>
        </div>
      </article>
    </motion.button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FeedSection({
  icon,
  label,
  title,
  subtitle,
  children,
  accentColor = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <section className="py-10 sm:py-14 border-t border-border/40">
      <div className="app-container">
        <div className="mb-8">
          <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${accentColor}`}>
            {icon}
            {label}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-base text-muted">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

// ─── Following users strip ────────────────────────────────────────────────────

function FollowingStrip({ users }: { users: FollowingUser[] }) {
  if (users.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {users.map((u) => (
        <Link
          key={u._id}
          href={`/profile/${u._id}`}
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold transition hover:border-primary/50 hover:bg-primary/5"
        >
          {u.avatar && u.avatar !== "default-avatar.png" ? (
            <img src={u.avatar} alt={u.name} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
              {u.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          {u.name}
        </Link>
      ))}
    </div>
  );
}

// ─── Post grid ───────────────────────────────────────────────────────────────

function PostGrid({
  portfolios,
  onOpen,
  emptyMessage,
}: {
  portfolios: PortfolioSummary[];
  onOpen: (id: string) => void;
  emptyMessage?: string;
}) {
  if (portfolios.length === 0) {
    return (
      <p className="text-sm text-muted italic">{emptyMessage || "Chưa có bài viết."}</p>
    );
  }
  return (
    <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <AnimatePresence>
        {portfolios.map((p, i) => (
          <MiniPortfolioCard key={p._id} portfolio={p} index={i} onOpen={onOpen} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-14">
      {[0, 1].map((s) => (
        <div key={s} className="py-10 border-t border-border/40">
          <div className="app-container">
            <div className="mb-8 space-y-2">
              <div className="h-3 w-20 animate-pulse rounded-full bg-surface-soft" />
              <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-soft" />
              <div className="h-4 w-72 animate-pulse rounded-full bg-surface-soft" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
                  <div className="aspect-[4/3] animate-pulse bg-surface-soft" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 w-4/5 animate-pulse rounded bg-surface-soft" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-surface-soft" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ForYouPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  const [sections, setSections]   = useState<Sections | null>(null);
  const [meta, setMeta]           = useState<FeedMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login?next=/for-you");
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const res = await api.get<FeedResponse>("/api/portfolios/just-for-you?limit=12");
        if (cancelled) return;
        setSections(res.data.sections);
        setMeta(res.data.meta);
      } catch {
        if (!cancelled) setError("Không thể tải feed. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, isHydrated]);

  const normalize = (raw: RawPortfolio[]) =>
    (raw || []).map((item) => normalizePortfolio(item));

  if (!isHydrated) return null;
  if (!isAuthenticated) return null;

  const followingPosts = normalize(sections?.followingPosts || []);
  const tagPosts       = normalize(sections?.tagPosts || []);
  const randomPosts    = normalize(sections?.randomPosts || []);
  const likedTags      = sections?.likedTags || [];
  const followingUsers = sections?.followingUsers || [];

  const noContent =
    !isLoading &&
    followingPosts.length === 0 &&
    tagPosts.length === 0 &&
    randomPosts.length === 0;

  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border/50 bg-surface/80 py-12 backdrop-blur-md">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_80%_at_50%_-10%,rgba(120,119,198,0.12),transparent)] dark:bg-[radial-gradient(ellipse_70%_80%_at_50%_-10%,rgba(120,119,198,0.08),transparent)]" />
        <div className="app-container">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                Cá nhân hóa
              </p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Dành cho bạn
              </h1>
              <p className="mt-3 max-w-xl text-base text-muted">
                Tổng hợp bài viết từ những người bạn theo dõi và các tác phẩm cùng sở thích của bạn.
              </p>
            </div>

            {/* Stats pills */}
            {meta && (
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {meta.followingCount} đang theo dõi
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold">
                  <Heart className="h-3.5 w-3.5 text-danger" />
                  {meta.likedTagCount} tag yêu thích
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && <FeedSkeleton />}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="app-container py-16">
          <StateBlock
            type="error"
            title="Không tải được feed"
            description={error}
            actionLabel="Thử lại"
            onAction={() => window.location.reload()}
          />
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {noContent && !error && (
        <div className="app-container py-16">
          <StateBlock
            type="empty"
            title="Feed của bạn đang trống"
            description="Hãy theo dõi thêm người dùng và để lại một số ♥ để chúng tôi cá nhân hóa feed cho bạn."
            actionLabel="Khám phá portfolio"
            actionHref="/portfolios"
          />
        </div>
      )}

      {/* ── Section 1: Từ người đang follow ─────────────────────────────── */}
      {!isLoading && !error && (
        <>
          {(followingPosts.length > 0 || followingUsers.length > 0) && (
            <FeedSection
              icon={<Users className="h-3.5 w-3.5" />}
              label="Đang theo dõi"
              title="Bài mới từ người bạn follow"
              subtitle="Những tác phẩm mới nhất từ những người bạn đang theo dõi."
            >
              <FollowingStrip users={followingUsers} />
              <PostGrid
                portfolios={followingPosts}
                onOpen={setSelectedId}
                emptyMessage="Những người bạn theo dõi chưa đăng bài viết nào."
              />
            </FeedSection>
          )}

          {/* ── Section 2: Cùng tag sở thích ──────────────────────────── */}
          {tagPosts.length > 0 && (
            <FeedSection
              icon={<Tag className="h-3.5 w-3.5" />}
              label="Dựa trên sở thích"
              title="Tác phẩm bạn có thể thích"
              subtitle={
                likedTags.length > 0
                  ? `Dựa trên các tag bạn yêu thích: ${likedTags.slice(0, 5).map((t) => `#${t}`).join(", ")}${likedTags.length > 5 ? " và hơn thế nữa" : ""}.`
                  : undefined
              }
              accentColor="text-accent"
            >
              {/* Tag chips */}
              {likedTags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {likedTags.slice(0, 10).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <PostGrid portfolios={tagPosts} onOpen={setSelectedId} />
            </FeedSection>
          )}

          {/* ── Section 3: Random bổ sung ─────────────────────────────── */}
          {randomPosts.length > 0 && (
            <FeedSection
              icon={<Shuffle className="h-3.5 w-3.5" />}
              label="Khám phá thêm"
              title="Có thể bạn cũng thích"
              subtitle="Một số tác phẩm ngẫu nhiên để bạn khám phá thêm."
              accentColor="text-muted"
            >
              <PostGrid portfolios={randomPosts} onOpen={setSelectedId} />
            </FeedSection>
          )}

          {/* ── CTA nếu chưa có nhiều nội dung ───────────────────────── */}
          {!noContent && followingPosts.length < 4 && meta?.followingCount === 0 && (
            <div className="border-t border-border/40 py-10">
              <div className="app-container text-center">
                <p className="text-sm text-muted">
                  Theo dõi thêm tác giả để có feed phong phú hơn.{" "}
                  <Link href="/portfolios" className="font-semibold text-primary hover:underline">
                    Khám phá ngay →
                  </Link>
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Portfolio modal ──────────────────────────────────────────────── */}
      {selectedId && (
        <PortfolioModalShell onClose={() => setSelectedId(null)}>
          <PortfolioDetailClient
            key={selectedId}
            portfolioId={selectedId}
            mode="modal"
          />
        </PortfolioModalShell>
      )}
    </main>
  );
}
