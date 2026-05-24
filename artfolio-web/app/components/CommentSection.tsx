"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../utils/api";
import StateBlock from "../components/StateBlock";

type CommentItem = {
  _id: string;
  portfolioId: string;
  text: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
};

type NewCommentPayload =
  | CommentItem
  | {
      portfolioId: string;
      comment: CommentItem;
    };

type CommentSectionProps = {
  portfolioId: string;
};

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
        const data = response.data?.data || response.data?.comments || [];

        if (!isMounted) return;

        setComments(
          data.map((comment: CommentItem) => ({
            ...comment,
            portfolioId,
          }))
        );
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load comments:", error);
        setComments([]);
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
      const nextComment = "comment" in payload ? payload.comment : payload;
      const nextPortfolioId = payload.portfolioId || nextComment.portfolioId;

      if (nextPortfolioId !== portfolioId) return;

      setComments((current) => {
        const existed = current.some(
          (comment) => comment._id === nextComment._id
        );

        if (existed) {
          return current;
        }

        return [{ ...nextComment, portfolioId }, ...current];
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
      _id: `local-comment-${Date.now()}`,
      portfolioId,
      text: trimmedContent,
      user: {
        _id: user._id || user.id,
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
        text: trimmedContent,
      });

      setMessage("Đã bình luận.");
    } catch {
      setComments((current) =>
        current.filter((comment) => comment._id !== optimisticComment._id)
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
              key={comment._id}
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
                    {comment.text}
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
