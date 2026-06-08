"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Edit3,
  Loader2,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import StateBlock from "../../components/StateBlock";
import { useAuthStore } from "../../store/useAuthStore";
import type { PortfolioComment, PortfolioDetail } from "../../types/api";
import { getApiUrl, getSocketUrl } from "../../utils/apiConfig";


type PortfolioDetailClientProps = {
  portfolioId: string;
  mode?: "page" | "modal";
  initialPortfolio?: PortfolioDetail | null;
  initialComments?: PortfolioComment[];
  initialErrorMessage?: string;
  onDeleted?: (portfolioId: string) => void;
};

type Comment = PortfolioComment;

type RawComment = Comment & {
  content?: string;
};
type EditFormState = {
  title: string;
  description: string;
  category: PortfolioDetail["category"];
  tags: string;
};

function getEditFormStateFromPortfolio(
  portfolio: PortfolioDetail,
): EditFormState {
  return {
    title: portfolio.title || "",
    description: portfolio.description || "",
    category: portfolio.category || "design",
    tags: portfolio.tags?.join(", ") || "",
  };
}

function parseEditTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

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

function notifyPortfolioLikeChanged(portfolioId: string, likesCount: number) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("artfolio:portfolio-like-changed", {
      detail: {
        portfolioId,
        likesCount,
      },
    }),
  );
}

export default function PortfolioDetailClient({
  portfolioId,
  mode = "page",
  initialPortfolio = null,
  initialComments = [],
  initialErrorMessage = "",
  onDeleted,
}: PortfolioDetailClientProps) {
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  const currentUserId = getUserId(currentUser);
  const router = useRouter();
  const isModal = mode === "modal";

  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(
    initialPortfolio,
  );
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(
    !initialPortfolio && !initialErrorMessage,
  );

  const isOwner = useMemo(() => {
    if (!portfolio || !currentUserId) return false;
    const ownerId = portfolio.user?._id;
    return ownerId === currentUserId;
  }, [portfolio, currentUserId]);
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [likesCount, setLikesCount] = useState(initialPortfolio?.likesCount || 0);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [notice, setNotice] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false);
  const [isEditingPortfolio, setIsEditingPortfolio] = useState(false);
  const [editValues, setEditValues] = useState<EditFormState>({
    title: "",
    description: "",
    category: "design",
    tags: "",
  });
  const [initialEditValues, setInitialEditValues] =
    useState<EditFormState | null>(null);
  const [isUpdatingPortfolio, setIsUpdatingPortfolio] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState("");
  const [showDiscardEditConfirm, setShowDiscardEditConfirm] = useState(false);

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
  const hasUnsavedEditChanges = useMemo(() => {
  if (!initialEditValues) return false;

  return (
    editValues.title !== initialEditValues.title ||
    editValues.description !== initialEditValues.description ||
    editValues.category !== initialEditValues.category ||
    editValues.tags !== initialEditValues.tags
  );
}, [editValues, initialEditValues]);

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
    if (initialPortfolio || initialErrorMessage) return;


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
  }, [initialErrorMessage, initialPortfolio, portfolioId]);

  const ownerId = portfolio?.user?._id;

  useEffect(() => {
    if (!portfolioId || !ownerId) return;

    if (currentUserId && String(currentUserId) === String(ownerId)) {
      return;
    }

    const VIEW_DELAY_MS = 3000;

    const timer = window.setTimeout(async () => {
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
    }, VIEW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [portfolioId, ownerId, currentUserId]);

  useEffect(() => {
    function handleModalCloseRequest(event: Event) {
      if (!isEditingPortfolio) return;

      event.preventDefault();

      if (hasUnsavedEditChanges) {
        setShowDiscardEditConfirm(true);
        return;
      }

      setIsEditingPortfolio(false);
    }

    window.addEventListener(
      "artfolio:portfolio-modal-close-request",
      handleModalCloseRequest,
    );

    return () => {
      window.removeEventListener(
        "artfolio:portfolio-modal-close-request",
        handleModalCloseRequest,
      );
    };
  }, [hasUnsavedEditChanges, isEditingPortfolio]);
  function handleStartEditPortfolio() {
    if (!portfolio) return;

    const formState = getEditFormStateFromPortfolio(portfolio);

    setEditValues(formState);
    setInitialEditValues(formState);
    setEditErrorMessage("");
    setShowDiscardEditConfirm(false);
    setIsEditingPortfolio(true);
  }


  function handleDiscardEditChanges() {
    setShowDiscardEditConfirm(false);
    setIsEditingPortfolio(false);
    setEditErrorMessage("");

    if (portfolio) {
      const formState = getEditFormStateFromPortfolio(portfolio);
      setEditValues(formState);
      setInitialEditValues(formState);
    }
  }

  function updateEditField(field: keyof EditFormState, value: string) {
    setEditValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmitEditPortfolio(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setEditErrorMessage("");

    if (!accessToken) {
      toast.error("Phiên đăng nhập đã hết hạn.");
      return;
    }

    const title = editValues.title.trim();
    const description = editValues.description.trim();
    const tags = parseEditTags(editValues.tags);

    if (title.length < 5) {
      setEditErrorMessage("Tiêu đề ít nhất 5 ký tự.");
      return;
    }

    if (title.length > 100) {
      setEditErrorMessage("Tiêu đề tối đa 100 ký tự.");
      return;
    }

    if (description.length > 1000) {
      setEditErrorMessage("Mô tả tối đa 1000 ký tự.");
      return;
    }

    setIsUpdatingPortfolio(true);

    try {
      const response = await fetch(getApiUrl(`portfolios/${portfolioId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          description,
          category: editValues.category,
          tags,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.message || "Không thể cập nhật tác phẩm.");
      }

      const updatedPortfolio = json?.data as PortfolioDetail | undefined;

      setPortfolio((current) => {
        if (updatedPortfolio) return updatedPortfolio;

        if (!current) return current;

        return {
          ...current,
          title,
          description,
          category: editValues.category,
          tags,
        };
      });

      if (updatedPortfolio?.likesCount !== undefined) {
        setLikesCount(updatedPortfolio.likesCount || 0);
      }

      const nextFormState = updatedPortfolio
        ? getEditFormStateFromPortfolio(updatedPortfolio)
        : {
            title,
            description,
            category: editValues.category,
            tags: tags.join(", "),
          };

      setEditValues(nextFormState);
      setInitialEditValues(nextFormState);
      setIsEditingPortfolio(false);
      setShowDiscardEditConfirm(false);

      toast.success("Cập nhật tác phẩm thành công.");
    } catch (error) {
      setEditErrorMessage(
        error instanceof Error ? error.message : "Không thể cập nhật tác phẩm.",
      );
    } finally {
      setIsUpdatingPortfolio(false);
    }
  }
  async function handleToggleLike() {
    setNotice("");

    if (!isAuthenticated || !accessToken) {
      setNotice("Vui lòng đăng nhập để thích tác phẩm.");
      return;
    }

    const previousLiked = isLiked;
    const previousLikesCount = likesCount;
    const nextLiked = !previousLiked;
    const optimisticLikesCount = Math.max(
      0,
      previousLikesCount + (nextLiked ? 1 : -1),
    );

    setOptimisticLiked(nextLiked);
    setLikesCount(optimisticLikesCount);
    notifyPortfolioLikeChanged(portfolioId, optimisticLikesCount);

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
        const serverIsLiked = Boolean(json.data.isLiked);
        const serverLikesCount = Number(json.data.likesCount || 0);

        setOptimisticLiked(serverIsLiked);
        setLikesCount(serverLikesCount);
        notifyPortfolioLikeChanged(portfolioId, serverLikesCount);
      }

    } catch (error) {
      setOptimisticLiked(previousLiked);
      setLikesCount(previousLikesCount);
      notifyPortfolioLikeChanged(portfolioId, previousLikesCount);

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
    if (text.length > 500) {
      setNotice("Binh luan khong duoc vuot qua 500 ky tu.");
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
      toast.error("Phiên đăng nhập đã hết hạn.");
      return;
    }

    setIsDeletingPortfolio(true);

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

      toast.success("Đã xóa tác phẩm.");
      setShowDeleteConfirm(false);

      if (mode === "modal" && onDeleted) {
        onDeleted(portfolioId);
        return;
      }

      router.push("/dashboard?tab=portfolios");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa tác phẩm.",
      );
    } finally {
      setIsDeletingPortfolio(false);
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
  if (isEditingPortfolio && portfolio) {
    return (
      <main className={isModal ? "bg-background" : "min-h-screen bg-background"}>
        <div className="border-b border-border bg-surface/90 backdrop-blur">
          <div
            className={
              isModal
                ? "flex min-h-16 items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10"
                : "app-container flex min-h-16 items-center justify-between gap-4 py-3"
            }
          >
            <div>
              <p className="text-xs font-bold uppercase text-primary">
                Chỉnh sửa tác phẩm
              </p>
              <h1 className="text-xl font-extrabold text-foreground">
                {portfolio.title}
              </h1>
            </div>

          </div>
        </div>

        <div className={isModal ? "px-5 py-8 sm:px-8 lg:px-10" : "app-container py-8 lg:py-12"}>
          <form
            onSubmit={handleSubmitEditPortfolio}
            className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            <div className="grid gap-6">
              {editErrorMessage && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-semibold text-danger">
                  {editErrorMessage}
                </div>
              )}

              <label className="field">
                <span className="label">Tiêu đề *</span>
                <input
                  className="input"
                  value={editValues.title}
                  onChange={(event) => updateEditField("title", event.target.value)}
                  placeholder="Nhập tiêu đề tác phẩm..."
                />
              </label>

              <label className="field">
                <span className="label">Danh mục *</span>
                <select
                  className="input"
                  value={editValues.category}
                  onChange={(event) =>
                    updateEditField(
                      "category",
                      event.target.value as PortfolioDetail["category"],
                    )
                  }
                >
                  <option value="design">Design</option>
                  <option value="art">Art</option>
                  <option value="photo">Photography</option>
                  <option value="3d">3D Rendering</option>
                  <option value="other">Khác</option>
                </select>
              </label>

              <label className="field">
                <span className="label">Thẻ (Tags)</span>
                <input
                  className="input"
                  value={editValues.tags}
                  onChange={(event) => updateEditField("tags", event.target.value)}
                  placeholder="Phân cách bằng dấu phẩy (vd: ui, ux, dashboard)"
                />
              </label>

              <label className="field">
                <span className="label">Mô tả</span>
                <textarea
                  rows={6}
                  className="input h-auto py-3 leading-relaxed"
                  value={editValues.description}
                  onChange={(event) =>
                    updateEditField("description", event.target.value)
                  }
                  placeholder="Giới thiệu về quá trình và cảm hứng của bạn..."
                />
              </label>

              <div className="flex justify-center border-t border-border pt-6">
                <button
                  type="submit"
                  disabled={isUpdatingPortfolio}
                  className="btn btn-primary h-12 min-w-56 justify-center text-base"
                >
                  {isUpdatingPortfolio ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>

            <aside className="grid h-fit gap-5">
              <section className="surface rounded-lg p-5">
                <p className="mb-2 text-sm font-bold uppercase text-muted">
                  Ảnh hiện tại của tác phẩm
                </p>
                <p className="mb-4 text-xs leading-5 text-muted">
                  Bạn có thể chỉnh sửa tiêu đề, danh mục, thẻ và mô tả. Chức năng
                  thay đổi ảnh sẽ được bổ sung sau.
                </p>

                {portfolio.images?.length > 0 ? (
                  <div className="grid gap-3">
                    {portfolio.images.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-border bg-surface-soft"
                      >
                        <Image
                          src={image}
                          alt={`${portfolio.title} - ảnh ${index + 1}`}
                          width={640}
                          height={420}
                          className="h-auto w-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                          Ảnh {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-surface-soft p-8 text-center text-sm text-muted">
                    Không tìm thấy hình ảnh nào của tác phẩm.
                  </div>
                )}
              </section>
            </aside>
          </form>
        </div>

        {showDiscardEditConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-foreground">
                Bỏ chỉnh sửa?
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted">
                Bạn có thay đổi chưa được lưu. Nếu thoát bây giờ, nội dung chỉnh
                sửa sẽ bị mất.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleDiscardEditChanges}
                  className="btn btn-secondary"
                >
                  Thoát và bỏ thay đổi
                </button>

                <button
                  type="button"
                  onClick={() => setShowDiscardEditConfirm(false)}
                  className="btn btn-primary"
                >
                  Tiếp tục chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}
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
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition ${isLiked
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
                  <button
                    type="button"
                    onClick={handleStartEditPortfolio}
                    className="btn btn-outline w-full h-11 flex items-center justify-center gap-2 text-sm font-bold transition-all hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit3 className="h-4 w-4" /> Chỉnh sửa tác phẩm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-foreground">
              Xóa tác phẩm?
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              Bạn có chắc chắn muốn xóa tác phẩm này không? Hành động này không
              thể hoàn tác.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingPortfolio}
                className="btn btn-secondary"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleDeletePortfolio}
                disabled={isDeletingPortfolio}
                className="btn bg-danger text-white hover:bg-danger/90"
              >
                {isDeletingPortfolio ? "Đang xóa..." : "Xóa tác phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
