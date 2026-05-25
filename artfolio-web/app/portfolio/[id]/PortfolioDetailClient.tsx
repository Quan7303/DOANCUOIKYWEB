"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Edit3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import StateBlock from "../../components/StateBlock";
import { useAuthStore } from "../../store/useAuthStore";
import type { PortfolioDetail } from "../../types/api";
import { getApiUrl, getSocketUrl } from "../../utils/apiConfig";

type PortfolioDetailClientProps = {
  portfolioId: string;
  mode?: "page" | "modal";
};

type Comment = {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  createdAt: string;
};

type RawComment = Comment & {
  content?: string;
};

const categoryLabels: Record<string, string> = {
  design: "Thiết kế",
  art: "Nghệ thuật",
  photo: "Nhiếp ảnh",
  "3d": "3D",
  other: "Khác",
};

function getUserId(user: { _id?: string; id?: string } | null | undefined) {
  return user?._id || user?.id || "";
}

function normalizeComment(comment: RawComment): Comment {
  return {
    _id: comment._id,
    user: comment.user,
    text: comment.text || comment.content || "",
    createdAt: comment.createdAt,
  };
}

function formatDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "A";
}

export default function PortfolioDetailClient({
  portfolioId,
  mode = "page",
}: PortfolioDetailClientProps) {
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const currentUserId = getUserId(currentUser);
  const router = useRouter();
  const isModal = mode === "modal";

  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = useMemo(() => {
    if (!portfolio || !currentUserId) return false;
    const ownerId = portfolio.user?._id;
    return ownerId === currentUserId;
  }, [portfolio, currentUserId]);
  const [errorMessage, setErrorMessage] = useState("");
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [notice, setNotice] = useState("");

  const categoryLabel = useMemo(() => {
    if (!portfolio) return "";
    return categoryLabels[portfolio.category] || portfolio.category;
  }, [portfolio]);
  const serverIsLiked = useMemo(() => {
    if (!portfolio || !currentUserId) return false;

    return (
      portfolio.likes?.some((id) => String(id) === String(currentUserId)) || false
    );
  }, [portfolio, currentUserId]);

const isLiked = optimisticLiked ?? serverIsLiked;

  useEffect(() => {
    const socket: Socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join_portfolio", portfolioId);
    });

    socket.on(
      "new_comment",
      (payload: { comment: RawComment; portfolioId: string }) => {
        if (payload.portfolioId !== portfolioId) return;

        setComments((current) => {
          if (current.some((comment) => comment._id === payload.comment._id)) {
            return current;
          }

          return [normalizeComment(payload.comment), ...current];
        });
      },
    );

    return () => {
      socket.emit("leave_portfolio", portfolioId);
      socket.disconnect();
    };
  }, [portfolioId]);

  useEffect(() => {

    let isMounted = true;

    async function loadPortfolio() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [portfolioResponse, commentResponse] = await Promise.all([
          fetch(getApiUrl(`portfolios/${portfolioId}`), {
            cache: "no-store",
          }),
          fetch(getApiUrl(`comments/portfolio/${portfolioId}`), {
            cache: "no-store",
          }),
        ]);

        if (!portfolioResponse.ok) {
          throw new Error("Không tìm thấy tác phẩm hoặc dữ liệu không hợp lệ.");
        }

        const portfolioJson = await portfolioResponse.json();
        const portfolioData = portfolioJson.data as PortfolioDetail;

        if (!isMounted) return;

        setPortfolio(portfolioData);
        setLikesCount(portfolioData.likesCount || 0);

        if (commentResponse.ok) {
          const commentJson = await commentResponse.json();
          setComments((commentJson.data || []).map(normalizeComment));
        } else {
          setComments([]);
        }
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu tác phẩm.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPortfolio();

    return () => {
      isMounted = false;
    };
  }, [portfolioId]);

  useEffect(() => {
    if (!portfolioId) return;

    const viewKey = `artfolio-view-lock-${portfolioId}`;
    const lastViewedAt = Number(sessionStorage.getItem(viewKey) || 0);
    const now = Date.now();

    if (now - lastViewedAt < 5000) return;

    sessionStorage.setItem(viewKey, String(now));

    async function increaseView() {
      try {
        const response = await fetch(getApiUrl(`portfolios/${portfolioId}/view`), {
          method: "POST",
          cache: "no-store",
        });

        const json = await response.json().catch(() => null);

        if (response.ok && json?.data?.views !== undefined) {
          setPortfolio((current) =>
            current
              ? {
                  ...current,
                  views: Number(json.data.views),
                }
              : current,
          );
        }
      } catch (error) {
        console.error("Increase view error:", error);
      }
    }

    increaseView();
  }, [portfolioId]);

  async function handleToggleLike() {
    setNotice("");

    if (!isAuthenticated || !accessToken) {
      setNotice("Vui lòng đăng nhập để thích tác phẩm.");
      return;
    }

    const nextLiked = !isLiked;
    setOptimisticLiked(nextLiked);
    setLikesCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));

    try {
      const response = await fetch(getApiUrl(`portfolios/${portfolioId}/like`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.message || "Không thể cập nhật lượt thích.");
      }

      if (json?.data) {
        setOptimisticLiked(Boolean(json.data.isLiked));
        setLikesCount(Number(json.data.likesCount || 0));
      }
    } catch (error) {
      setOptimisticLiked(!nextLiked);
      setLikesCount((current) => Math.max(0, current + (nextLiked ? -1 : 1)));
      setNotice(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật lượt thích.",
      );
    }
  }

  async function handlePostComment() {
    setNotice("");

    if (!isAuthenticated || !currentUser || !accessToken) {
      setNotice("Vui lòng đăng nhập để bình luận.");
      return;
    }

    const text = commentText.trim();
    if (text.length < 2) {
      setNotice("Bình luận phải có ít nhất 2 ký tự.");
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(getApiUrl("comments"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          portfolioId,
          text,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.message || "Không thể gửi bình luận.");
      }

      if (json?.data) {
        setComments((current) => {
          const newComment = normalizeComment(json.data);
          if (current.some((comment) => comment._id === newComment._id)) {
            return current;
          }

          return [newComment, ...current];
        });
      }

      setCommentText("");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể gửi bình luận.",
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    setNotice("");

    if (!accessToken) {
      setNotice("Phiên đăng nhập đã hết hạn.");
      return;
    }

    const confirmed = window.confirm("Bạn muốn xóa bình luận này?");
    if (!confirmed) return;

    try {
      const response = await fetch(getApiUrl(`comments/${commentId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.message || "Không thể xóa bình luận.");
      }

      setComments((current) =>
        current.filter((comment) => comment._id !== commentId),
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể xóa bình luận.",
      );
    }
  }

  async function handleDeletePortfolio() {
    setNotice("");

    if (!accessToken) {
      setNotice("Phiên đăng nhập đã hết hạn.");
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa tác phẩm này? Hành động này không thể hoàn tác!"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(getApiUrl(`portfolios/${portfolioId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.message || "Không thể xóa tác phẩm.");
      }

      alert("Đã xóa tác phẩm thành công!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể xóa tác phẩm."
      );
    }
  }

  if (isLoading) {
    return (
      <main
        className={
          isModal
            ? "flex min-h-[70vh] items-center justify-center bg-background"
            : "flex min-h-screen items-center justify-center bg-background"
        }
      >
        <StateBlock type="loading" title="Đang tải tác phẩm..." />
      </main>
    );
  }

  if (errorMessage || !portfolio) {
    return (
      <main
        className={
          isModal
            ? "flex min-h-[70vh] items-center justify-center bg-background"
            : "flex min-h-screen items-center justify-center bg-background"
        }
      >
        <StateBlock
          type="error"
          title="Không tìm thấy tác phẩm"
          description={errorMessage || "Tác phẩm không tồn tại hoặc đã bị xóa."}
          actionLabel="Quay lại khám phá"
          actionHref="/portfolios"
        />
      </main>
    );
  }

  return (
    <main className={isModal ? "bg-background" : "min-h-screen bg-background"}>
      <div
        className={
          isModal
            ? "border-b border-border bg-surface/90 backdrop-blur"
            : "sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur"
        }
      >
        <div
          className={
            isModal
              ? "flex h-16 items-center justify-end gap-4 px-5 sm:px-8 lg:px-10"
              : "app-container flex h-16 items-center justify-between gap-4"
          }
        >
          {!isModal && (
            <Link
              href="/portfolios"
              className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Khám phá
            </Link>
          )}

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
              <Eye className="h-4 w-4" />
              {portfolio.views?.toLocaleString("vi-VN") || 0}
            </span>
            <button
              type="button"
              onClick={handleToggleLike}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition ${
                isLiked
                  ? "border-danger/25 bg-danger/10 text-danger"
                  : "border-border bg-surface-soft text-muted hover:text-foreground"
              }`}
            >
              <Heart
                className="h-4 w-4"
                fill={isLiked ? "currentColor" : "none"}
              />
              {likesCount.toLocaleString("vi-VN")}
            </button>
          </div>
        </div>
      </div>

      <div className={isModal ? "px-5 py-8 sm:px-8 lg:px-10" : "app-container py-8 lg:py-12"}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
          <div className="grid gap-6">
            <motion.header
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge border-primary/30 text-primary">
                  {categoryLabel}
                </span>
                {portfolio.tags?.slice(0, 4).map((tag) => (
                  <span key={tag} className="badge">
                    #{tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
                {portfolio.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                {portfolio.description || "Tác giả chưa thêm mô tả cho tác phẩm này."}
              </p>
            </motion.header>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              {portfolio.images.map((image, index) => (
                <div key={`${image}-${index}`} className="relative bg-surface-soft">
                  <Image
                    src={image}
                    alt={`${portfolio.title} - ảnh ${index + 1}`}
                    width={1400}
                    height={900}
                    priority={index === 0}
                    className="h-auto w-full object-cover"
                  />
                </div>
              ))}
            </motion.div>
          </div>

          <aside className="grid h-fit gap-5 lg:sticky lg:top-24">
            <section className="surface rounded-lg p-5">
              <div className="flex items-center gap-3 border-b border-border pb-5">
                <Link href={`/profile/${portfolio.user._id}`} className="shrink-0">
                  {portfolio.user.avatar && portfolio.user.avatar !== "default-avatar.png" ? (
                    <Image
                      src={portfolio.user.avatar}
                      alt={portfolio.user.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-lg font-bold text-white">
                      {getInitials(portfolio.user.name)}
                    </span>
                  )}
                </Link>
                <div className="min-w-0">
                  <Link
                    href={`/profile/${portfolio.user._id}`}
                    className="block truncate font-bold hover:text-primary"
                  >
                    {portfolio.user.name}
                  </Link>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(portfolio.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface-soft p-3 text-center">
                  <strong className="block text-xl">
                    {portfolio.views?.toLocaleString("vi-VN") || 0}
                  </strong>
                  <span className="text-xs font-semibold text-muted">Lượt xem</span>
                </div>
                <div className="rounded-lg border border-border bg-surface-soft p-3 text-center">
                  <strong className="block text-xl">
                    {likesCount.toLocaleString("vi-VN")}
                  </strong>
                  <span className="text-xs font-semibold text-muted">Lượt thích</span>
                </div>
              </div>

              {portfolio.colors?.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-bold uppercase text-muted">
                    Bảng màu
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {portfolio.colors.map((color) => (
                      <div
                        key={color}
                        className="h-10 rounded-lg border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isOwner && (
                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                  <Link
                    href={`/portfolio/edit/${portfolioId}`}
                    className="btn btn-outline w-full h-11 flex items-center justify-center gap-2 text-sm font-bold transition-all hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit3 className="h-4 w-4" /> Chỉnh sửa tác phẩm
                  </Link>
                  <button
                    type="button"
                    onClick={handleDeletePortfolio}
                    className="btn btn-outline border-danger text-danger hover:bg-danger/10 hover:text-danger w-full h-11 flex items-center justify-center gap-2 text-sm font-bold transition-all"
                  >
                    <Trash2 className="h-4 w-4" /> Xóa tác phẩm
                  </button>
                </div>
              )}
            </section>

            <section className="surface rounded-lg p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-lg font-bold">
                  <MessageCircle className="h-5 w-5" />
                  Bình luận
                </h2>
                <span className="text-sm font-semibold text-muted">
                  {comments.length}
                </span>
              </div>

              {notice && (
                <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">
                  {notice}
                </p>
              )}

              {isAuthenticated ? (
                <div className="mb-5 grid gap-3">
                  <textarea
                    rows={3}
                    className="input min-h-24 resize-none py-3"
                    placeholder="Viết bình luận..."
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handlePostComment}
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="btn btn-primary justify-self-end"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmittingComment ? "Đang gửi..." : "Gửi"}
                  </button>
                </div>
              ) : (
                <div className="mb-5 rounded-lg border border-border bg-surface-soft p-4 text-sm text-muted">
                  Vui lòng{" "}
                  <Link href="/login" className="font-bold text-primary">
                    đăng nhập
                  </Link>{" "}
                  để bình luận.
                </div>
              )}

              <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted">
                    Chưa có bình luận nào.
                  </p>
                ) : (
                  comments.map((comment) => {
                    const isMyComment = currentUserId === comment.user._id;

                    return (
                      <article
                        key={comment._id}
                        className="group rounded-lg border border-border bg-surface-soft p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Link
                            href={`/profile/${comment.user._id}`}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white"
                          >
                            {comment.user.avatar && comment.user.avatar !== "default-avatar.png" ? (
                              <img
                                src={comment.user.avatar}
                                alt={comment.user.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(comment.user.name)
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <Link
                                  href={`/profile/${comment.user._id}`}
                                  className="font-bold hover:text-primary"
                                >
                                  {comment.user.name}
                                </Link>
                                <p className="text-xs text-muted">
                                  {formatDate(comment.createdAt)}
                                </p>
                              </div>
                              {isMyComment && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="rounded-md p-1.5 text-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                                  title="Xóa bình luận"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
