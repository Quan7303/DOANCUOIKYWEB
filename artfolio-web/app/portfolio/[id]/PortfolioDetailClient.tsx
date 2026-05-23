"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { portfolios as samplePortfolios } from "../../data/portfolios";
import type { PortfolioDetail } from "../../types/api";

const LOCAL_PORTFOLIOS_KEY = "artfolio-local-portfolios";
const LIKED_PORTFOLIOS_KEY = "artfolio-liked-portfolios";
const LIKE_COUNTS_KEY = "artfolio-like-counts";
const FOLLOWED_AUTHORS_KEY = "artfolio-followed-authors";

const categoryLabels: Record<string, string> = {
  design: "Design",
  art: "Art",
  photo: "Photo",
  "3d": "3D",
  other: "Other",
};

type ExtendedPortfolio = PortfolioDetail & {
  id?: string;
  slug?: string;
  author?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  createdAt?: string;
  colors?: string[];
  tags?: string[];
};

type PortfolioDetailClientProps = {
  id: string;
  mode?: "page" | "modal";
};

function readLocalPortfolios(): ExtendedPortfolio[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LOCAL_PORTFOLIOS_KEY);
    return raw ? (JSON.parse(raw) as ExtendedPortfolio[]) : [];
  } catch {
    return [];
  }
}

function saveLocalPortfolios(items: ExtendedPortfolio[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_PORTFOLIOS_KEY, JSON.stringify(items));
}

function readStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveStringArray(key: string, items: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

function readNumberRecord(key: string): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveNumberRecord(key: string, value: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function getPortfolioId(portfolio: ExtendedPortfolio) {
  return portfolio._id || portfolio.id || portfolio.slug || "";
}

function getAuthorId(portfolio: ExtendedPortfolio) {
  return (
    portfolio.author?.id ||
    portfolio.user?.id ||
    portfolio.author?.name ||
    portfolio.user?.name ||
    "unknown-author"
  );
}

function getAuthorName(portfolio: ExtendedPortfolio) {
  return portfolio.author?.name || portfolio.user?.name || "Creative User";
}

export default function PortfolioDetailClient({
  id,
  mode = "page",
}: PortfolioDetailClientProps) {
  const router = useRouter();

  const [localPortfolios, setLocalPortfolios] = useState<ExtendedPortfolio[]>(
    []
  );
  const [hasLoadedLocalStorage, setHasLoadedLocalStorage] = useState(false);

  const [comments, setComments] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");

  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setLocalPortfolios(readLocalPortfolios());
      setHasLoadedLocalStorage(true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  const [portfolio, setPortfolio] = useState<ExtendedPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasLoadedLocalStorage) return;

    async function fetchPortfolio() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/portfolios/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Lấy data từ response
          const fetchedData = data.data || data;
          setPortfolio(fetchedData);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Lỗi gọi API, dùng fallback tĩnh:", err);
      }

      // Fallback local
      const allPortfolios = [
        ...localPortfolios,
        ...(samplePortfolios as unknown as ExtendedPortfolio[]),
      ];

      const found = allPortfolios.find((item) => {
        const portfolioId = getPortfolioId(item);
        const slug = item.slug || "";
        return portfolioId === id || slug === id;
      });
      
      setPortfolio(found || null);
      setIsLoading(false);
    }

    fetchPortfolio();
  }, [id, hasLoadedLocalStorage, localPortfolios]);

  const portfolioId = portfolio ? getPortfolioId(portfolio) : id;
  const authorId = portfolio ? getAuthorId(portfolio) : "";
  const authorName = portfolio ? getAuthorName(portfolio) : "Creative User";

  useEffect(() => {
    if (!portfolio) return;

    const timerId = window.setTimeout(() => {
      const likedIds = readStringArray(LIKED_PORTFOLIOS_KEY);
      const followedAuthors = readStringArray(FOLLOWED_AUTHORS_KEY);
      const likeCounts = readNumberRecord(LIKE_COUNTS_KEY);

      setIsLiked(likedIds.includes(portfolioId));
      setIsFollowing(followedAuthors.includes(authorId));
      setLikeCount(likeCounts[portfolioId] ?? portfolio.likesCount ?? 0);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [portfolio, portfolioId, authorId]);

  function showStatus(message: string) {
    toast.success(message);
  }

  function updateLocalPortfolioLikes(nextLikeCount: number) {
    const updatedLocalPortfolios = readLocalPortfolios().map((item) => {
      if (getPortfolioId(item) !== portfolioId) {
        return item;
      }

      return {
        ...item,
        likesCount: nextLikeCount,
      };
    });

    saveLocalPortfolios(updatedLocalPortfolios);
    setLocalPortfolios(updatedLocalPortfolios);
  }

  function handleToggleLike() {
    if (!portfolio) return;

    const likedIds = readStringArray(LIKED_PORTFOLIOS_KEY);
    const likeCounts = readNumberRecord(LIKE_COUNTS_KEY);

    const nextIsLiked = !isLiked;
    const nextLikeCount = nextIsLiked
      ? likeCount + 1
      : Math.max(0, likeCount - 1);

    const nextLikedIds = nextIsLiked
      ? [...likedIds, portfolioId]
      : likedIds.filter((item) => item !== portfolioId);

    const uniqueLikedIds = Array.from(new Set(nextLikedIds));

    likeCounts[portfolioId] = nextLikeCount;

    saveStringArray(LIKED_PORTFOLIOS_KEY, uniqueLikedIds);
    saveNumberRecord(LIKE_COUNTS_KEY, likeCounts);
    updateLocalPortfolioLikes(nextLikeCount);
    
    window.dispatchEvent(new Event("artfolio-like-updated"));

    setIsLiked(nextIsLiked);
    setLikeCount(nextLikeCount);

    showStatus(nextIsLiked ? "Đã thích tác phẩm" : "Đã bỏ thích");
  }

  function handleToggleFollow() {
    if (!portfolio) return;

    const followedAuthors = readStringArray(FOLLOWED_AUTHORS_KEY);
    const nextIsFollowing = !isFollowing;

    const nextFollowedAuthors = nextIsFollowing
      ? [...followedAuthors, authorId]
      : followedAuthors.filter((item) => item !== authorId);

    const uniqueFollowedAuthors = Array.from(new Set(nextFollowedAuthors));

    saveStringArray(FOLLOWED_AUTHORS_KEY, uniqueFollowedAuthors);
    setIsFollowing(nextIsFollowing);

    showStatus(
      nextIsFollowing
        ? `Đang theo dõi ${authorName}`
        : `Đã hủy theo dõi ${authorName}`
    );
  }

  function handleAddComment() {
    if (!commentText.trim()) return;

    setComments((current) => [...current, commentText.trim()]);
    setCommentText("");
    showStatus("Đã bình luận");
  }

  if (!hasLoadedLocalStorage || isLoading) {
    return (
      <main className="min-h-screen bg-background py-10">
        <div className="app-container">
          <div className="surface rounded-lg p-10 text-center">
            <p className="text-lg font-bold">Đang tải tác phẩm...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!portfolio) {
    return (
      <main className="min-h-screen bg-background py-10">
        <div className="app-container">
          <div className="surface rounded-lg p-10 text-center">
            <p className="text-lg font-bold">Không tìm thấy tác phẩm</p>
            <p className="mt-2 text-sm text-muted">
              Tác phẩm không tồn tại hoặc chưa được lưu trong trình duyệt này.
            </p>

            <Link href="/dashboard" className="btn btn-primary mt-5">
              Quay về Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const image = portfolio.images?.[0] || "/next.svg";
  const tags = portfolio.tags || [];
  const colors = portfolio.colors || [];

  const content = (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4">
        <div className="overflow-hidden rounded-lg bg-surface-soft">
          {image.startsWith("data:") ? (
            <img
              src={image}
              alt={portfolio.title}
              className="max-h-[520px] w-full object-cover"
            />
          ) : (
            <div className="relative aspect-video w-full bg-surface-soft">
              <Image
                src={image}
                alt={portfolio.title}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div className="surface rounded-lg p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="badge">
              {categoryLabels[portfolio.category] ?? portfolio.category}
            </span>

            {tags.map((tag) => (
              <span key={tag} className="badge">
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold">{portfolio.title}</h1>

          <p className="mt-4 leading-7 text-muted">{portfolio.description}</p>
        </div>

        <div className="surface rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Bình luận</h2>
            <span className="text-sm text-muted">{comments.length} mục</span>
          </div>

          <div className="mb-4 flex gap-3">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="input"
              placeholder="Viết bình luận..."
            />

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddComment}
            >
              Gửi
            </button>
          </div>

          {comments.length === 0 ? (
            <p className="text-sm text-muted">Chưa có bình luận nào.</p>
          ) : (
            <div className="grid gap-3">
              {comments.map((comment, index) => (
                <div
                  key={`${comment}-${index}`}
                  className="rounded-lg border border-border bg-surface-soft p-3 text-sm"
                >
                  {comment}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="grid h-fit gap-4">
        <div className="surface rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-bold text-white">
              {authorName.slice(0, 1)}
            </div>

            <div>
              <p className="font-bold">{authorName}</p>
              <p className="text-sm text-muted">
                {portfolio.createdAt
                  ? new Date(portfolio.createdAt).toLocaleDateString("vi-VN")
                  : "Chưa rõ ngày"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-border bg-surface-soft p-3">
              <strong className="block text-xl">
                {portfolio.views?.toLocaleString("vi-VN") || 0}
              </strong>
              <span className="text-xs text-muted">lượt xem</span>
            </div>

            <div className="rounded-lg border border-border bg-surface-soft p-3">
              <strong className="block text-xl">
                {likeCount.toLocaleString("vi-VN")}
              </strong>
              <span className="text-xs text-muted">lượt thích</span>
            </div>
          </div>


          <button
            type="button"
            className={`btn mt-5 w-full ${
              isLiked ? "btn-primary" : "btn-secondary"
            }`}
            onClick={handleToggleLike}
          >
            {isLiked ? "Đã thích" : "Thích"}
          </button>

          <button
            type="button"
            className={`btn mt-3 w-full ${
              isFollowing ? "btn-primary" : "btn-secondary"
            }`}
            onClick={handleToggleFollow}
          >
            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
          </button>

          <button type="button" className="btn btn-primary mt-3 w-full">
            Xuất PDF
          </button>
        </div>

        {colors.length > 0 && (
          <div className="surface rounded-lg p-5">
            <h3 className="mb-3 font-bold">Bảng màu</h3>

            <div className="grid grid-cols-3 gap-2">
              {colors.map((color) => (
                <div
                  key={color}
                  className="h-12 rounded-md border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );

  if (mode === "modal") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-xl bg-background p-5 shadow-2xl">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-sm font-bold"
            >
              X
            </button>
          </div>

          {content}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="app-container">
        <Link
          href="/dashboard"
          className="mb-5 inline-block text-sm font-bold text-primary"
        >
          ← Quay về Dashboard
        </Link>

        {content}
      </div>
    </main>
  );
}