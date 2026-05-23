"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../utils/api";
import StateBlock from "../components/StateBlock";

type CommentItem = {
  id: string;
  portfolioId: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
};

type NewCommentPayload = CommentItem;

type CommentSectionProps = {
  portfolioId: string;
};

const COMMENT_STORAGE_KEY = "artfolio-comments";

function readLocalComments(portfolioId: string): CommentItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(COMMENT_STORAGE_KEY);
    const allComments = raw ? (JSON.parse(raw) as CommentItem[]) : [];

    return allComments.filter((comment) => comment.portfolioId === portfolioId);
  } catch {
    return [];
  }
}

function saveLocalComment(comment: CommentItem) {
  if (typeof window === "undefined") return;

  const raw = localStorage.getItem(COMMENT_STORAGE_KEY);
  const allComments = raw ? (JSON.parse(raw) as CommentItem[]) : [];

  localStorage.setItem(
    COMMENT_STORAGE_KEY,
    JSON.stringify([comment, ...allComments])
  );
}

function CommentSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-surface-soft" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-soft" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-surface-soft" />
        </div>
      ))}
    </div>
  );
}

export default function CommentSection({ portfolioId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { socket } = useSocket({
    userId: user?.id,
    portfolioId,
  });

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [comments]);

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      setIsLoading(true);

      try {
        const response = await api.get(`/api/comments/portfolio/${portfolioId}`);
        const data = response.data?.data?.comments || response.data?.comments || [];

        if (!isMounted) return;

        setComments(data);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load comments:", error);
        setComments(readLocalComments(portfolioId));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [portfolioId]);

  useEffect(() => {
    if (!socket) return;

    function handleNewComment(payload: NewCommentPayload) {
      if (payload.portfolioId !== portfolioId) return;

      setComments((current) => {
        const existed = current.some((comment) => comment.id === payload.id);

        if (existed) {
          return current;
        }

        return [payload, ...current];
      });
    }

    socket.on("new_comment", handleNewComment);

    return () => {
      socket.off("new_comment", handleNewComment);
    };
  }, [socket, portfolioId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isAuthenticated || !user) {
      setMessage("Vui lòng đăng nhập để bình luận.");
      return;
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < 2) {
      setMessage("Bình luận phải có ít nhất 2 ký tự.");
      return;
    }

    const optimisticComment: CommentItem = {
      id: `local-comment-${Date.now()}`,
      portfolioId,
      content: trimmedContent,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [optimisticComment, ...current]);
    setContent("");
    setIsSubmitting(true);

    try {
      await api.post("/api/comments", {
        portfolioId,
        content: trimmedContent,
      });

      socket?.emit("create_comment", optimisticComment);
      setMessage("Đã bình luận.");
    } catch {
      setComments((current) =>
        current.filter((comment) => comment.id !== optimisticComment.id)
      );
      setMessage("Gửi bình luận thất bại. Đã hoàn tác.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="surface rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Bình luận</h2>
          <p className="text-sm text-muted">
            Bình luận mới sẽ hiển thị realtime khi backend socket sẵn sàng.
          </p>
        </div>

        <span className="text-sm text-muted">
          {comments.length} bình luận
        </span>
      </div>

      <form className="mb-5 grid gap-3 sm:flex" onSubmit={handleSubmit}>
        <input
          className="input flex-1"
          placeholder="Viết bình luận..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />

        <button
          type="submit"
          className="btn btn-primary w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang gửi..." : "Gửi"}
        </button>
      </form>

      {message && <p className="mb-4 text-sm text-muted">{message}</p>}

      {isLoading ? (
        <CommentSkeleton />
      ) : sortedComments.length === 0 ? (
        <StateBlock
          type="empty"
          title="Chưa có bình luận nào"
          description="Hãy là người đầu tiên để lại nhận xét cho tác phẩm này."
        />
      ) : (
        <div className="grid gap-3">
          {sortedComments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                  {comment.user.avatar ? (
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    comment.user.name.slice(0, 1)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{comment.user.name}</p>
                    <span className="text-xs text-muted">
                      {new Date(comment.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-muted">
                    {comment.content}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}