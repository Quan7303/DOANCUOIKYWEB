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
  parentId?: string | null;
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

function Avatar({ user }: { user: CommentItem["user"] }) {
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white overflow-hidden">
      {user.avatar && user.avatar !== "default-avatar.png" ? (
        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        user.name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-xl border border-border bg-surface p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-soft" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-soft" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-surface-soft" />
        </div>
      ))}
    </div>
  );
}

function ReplyInput({
  replyingTo,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  replyingTo: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 2) return;
    onSubmit(text.trim());
    setText("");
  }

  return (
    <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
      <input
        autoFocus
        className="input flex-1 text-sm h-9 py-1"
        placeholder={`Trả lời ${replyingTo}...`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        disabled={isSubmitting || text.trim().length < 2}
        className="btn btn-primary h-9 px-3 text-xs"
      >
        {isSubmitting ? "..." : "Gửi"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="btn h-9 px-3 text-xs text-muted border border-border bg-surface hover:bg-surface-soft"
      >
        Hủy
      </button>
    </form>
  );
}

function CommentNode({
  comment,
  replies,
  currentUserId,
  isAuthenticated,
  onReply,
  onDelete,
  replyingToId,
  setReplyingToId,
  isSubmittingReply,
}: {
  comment: CommentItem;
  replies: CommentItem[];
  currentUserId?: string;
  isAuthenticated: boolean;
  onReply: (parentId: string, text: string) => void;
  onDelete: (id: string, parentId?: string | null) => void;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  isSubmittingReply: boolean;
}) {
  const isOwn = currentUserId && comment.user._id === currentUserId;

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      {/* Comment gốc */}
      <div className="flex items-start gap-3">
        <Avatar user={comment.user} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm">{comment.user.name}</p>
            <span className="text-xs text-muted">
              {new Date(comment.createdAt).toLocaleString("vi-VN")}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-foreground">{comment.text}</p>
          <div className="mt-1 flex items-center gap-3">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setReplyingToId(replyingToId === comment._id ? null : comment._id)}
                className="text-xs font-semibold text-muted hover:text-primary transition-colors"
              >
                {replyingToId === comment._id ? "Hủy" : "Trả lời"}
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={() => onDelete(comment._id, null)}
                className="text-xs font-semibold text-muted hover:text-danger transition-colors"
              >
                Xóa
              </button>
            )}
          </div>

          {replyingToId === comment._id && (
            <ReplyInput
              replyingTo={comment.user.name}
              onSubmit={(text) => onReply(comment._id, text)}
              onCancel={() => setReplyingToId(null)}
              isSubmitting={isSubmittingReply}
            />
          )}
        </div>
      </div>

      {/* Replies lồng nhau */}
      {replies.length > 0 && (
        <div className="mt-3 ml-12 grid gap-3 border-l-2 border-border pl-4">
          {replies.map((reply) => {
            const isReplyOwn = currentUserId && reply.user._id === currentUserId;
            return (
              <div key={reply._id} className="flex items-start gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white overflow-hidden">
                  {reply.user.avatar && reply.user.avatar !== "default-avatar.png" ? (
                    <img src={reply.user.avatar} alt={reply.user.name} className="h-full w-full object-cover" />
                  ) : (
                    reply.user.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm">{reply.user.name}</p>
                    <span className="text-xs text-muted">
                      {new Date(reply.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-foreground">{reply.text}</p>
                  <div className="mt-1 flex items-center gap-3">
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => setReplyingToId(replyingToId === reply._id ? null : reply._id)}
                        className="text-xs font-semibold text-muted hover:text-primary transition-colors"
                      >
                        {replyingToId === reply._id ? "Hủy" : "Trả lời"}
                      </button>
                    )}
                    {isReplyOwn && (
                      <button
                        type="button"
                        onClick={() => onDelete(reply._id, reply.parentId)}
                        className="text-xs font-semibold text-muted hover:text-danger transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  {/* Reply vào reply — vẫn nối vào comment gốc */}
                  {replyingToId === reply._id && (
                    <ReplyInput
                      replyingTo={reply.user.name}
                      onSubmit={(text) => onReply(comment._id, text)}
                      onCancel={() => setReplyingToId(null)}
                      isSubmitting={isSubmittingReply}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default function CommentSection({ portfolioId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { socket } = useSocket({ userId: user?.id, portfolioId });

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [message, setMessage] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  // Tách root comments và replies
  const { rootComments, repliesMap } = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const map: Record<string, CommentItem[]> = {};
    comments
      .filter((c) => c.parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((c) => {
        const pid = c.parentId!;
        if (!map[pid]) map[pid] = [];
        map[pid].push(c);
      });
    return { rootComments: roots, repliesMap: map };
  }, [comments]);

  useEffect(() => {
    let isMounted = true;
    async function loadComments() {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/comments/portfolio/${portfolioId}`);
        const data = response.data?.data || response.data?.comments || [];
        if (!isMounted) return;
        setComments(data.map((c: CommentItem) => ({ ...c, portfolioId })));
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load comments:", error);
        setComments([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadComments();
    return () => { isMounted = false; };
  }, [portfolioId]);

  useEffect(() => {
    if (!socket) return;
    function handleNewComment(payload: NewCommentPayload) {
      const nextComment = "comment" in payload ? payload.comment : payload;
      const nextPortfolioId = payload.portfolioId || nextComment.portfolioId;
      if (nextPortfolioId !== portfolioId) return;
      setComments((current) => {
        if (current.some((c) => c._id === nextComment._id)) return current;
        return [...current, { ...nextComment, portfolioId }];
      });
    }
    socket.on("new_comment", handleNewComment);
    return () => { socket.off("new_comment", handleNewComment); };
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
      _id: `local-${Date.now()}`,
      portfolioId,
      text: trimmedContent,
      parentId: null,
      user: { _id: user._id || user.id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [optimisticComment, ...current]);
    setContent("");
    setIsSubmitting(true);

    try {
      await api.post("/api/comments", { portfolioId, text: trimmedContent });
    } catch {
      setComments((current) => current.filter((c) => c._id !== optimisticComment._id));
      setMessage("Gửi bình luận thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReply(parentId: string, text: string) {
    if (!isAuthenticated || !user) return;
    setIsSubmittingReply(true);

    const optimisticReply: CommentItem = {
      _id: `local-reply-${Date.now()}`,
      portfolioId,
      text,
      parentId,
      user: { _id: user._id || user.id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [...current, optimisticReply]);
    setReplyingToId(null);

    try {
      await api.post("/api/comments", { portfolioId, text, parentId });
    } catch {
      setComments((current) => current.filter((c) => c._id !== optimisticReply._id));
      setMessage("Gửi trả lời thất bại.");
    } finally {
      setIsSubmittingReply(false);
    }
  }

  async function handleDelete(id: string, parentId?: string | null) {
    setComments((current) => {
      // Nếu là root comment, xóa luôn cả replies
      if (!parentId) {
        return current.filter((c) => c._id !== id && c.parentId !== id);
      }
      return current.filter((c) => c._id !== id);
    });
    try {
      await api.delete(`/api/comments/${id}`);
    } catch {
      setMessage("Xóa bình luận thất bại.");
    }
  }

  const totalCount = comments.length;

  return (
    <section className="surface rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Bình luận</h2>
          <p className="text-sm text-muted">
            Bình luận mới sẽ hiển thị realtime khi backend socket sẵn sàng.
          </p>
        </div>
        <span className="text-sm text-muted">{totalCount} bình luận</span>
      </div>

      <form className="mb-5 grid gap-3 sm:flex" onSubmit={handleSubmit}>
        <input
          className="input flex-1"
          placeholder="Viết bình luận..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
      ) : rootComments.length === 0 ? (
        <StateBlock
          type="empty"
          title="Chưa có bình luận nào"
          description="Hãy là người đầu tiên để lại nhận xét cho tác phẩm này."
        />
      ) : (
        <div className="grid gap-3">
          {rootComments.map((comment) => (
            <CommentNode
              key={comment._id}
              comment={comment}
              replies={repliesMap[comment._id] || []}
              currentUserId={user?._id || user?.id}
              isAuthenticated={isAuthenticated}
              onReply={handleReply}
              onDelete={handleDelete}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              isSubmittingReply={isSubmittingReply}
            />
          ))}
        </div>
      )}
    </section>
  );
}
