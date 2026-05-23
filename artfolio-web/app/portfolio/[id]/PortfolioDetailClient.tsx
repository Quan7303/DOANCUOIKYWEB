"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import { Heart, Eye, ArrowLeft, Trash2, Send, MessageCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import StateBlock from "../../components/StateBlock";
import { useAuthStore } from "../../../store/useAuthStore";
import type { PortfolioDetail } from "../../types/api";

type PortfolioDetailClientProps = {
  portfolioId: string;
};

// Kiểu bình luận trả về từ Backend
type Comment = {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
};

export default function PortfolioDetailClient({
  portfolioId,
}: PortfolioDetailClientProps) {
  const { user: currentUser, isAuthenticated, accessToken } = useAuthStore();
  
  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Tương tác
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Setup Socket.io
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Lấy origin từ apiUrl (ví dụ http://localhost:5000)
    const socketUrl = apiUrl.replace("/api", "");
    
    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.io:", socket.id);
      socket.emit("join_portfolio", portfolioId);
    });

    socket.on("new_comment", (data: { comment: Comment; portfolioId: string }) => {
      if (data.portfolioId === portfolioId) {
        setComments((prev) => {
          // Tránh duplicate comment (do chính user vừa post cũng sẽ nhận event broadcast)
          if (prev.some((c) => c._id === data.comment._id)) return prev;
          return [data.comment, ...prev];
        });
      }
    });

    return () => {
      socket.emit("leave_portfolio", portfolioId);
      socket.disconnect();
    };
  }, [portfolioId]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        
        // Fetch Portfolio Detail
        const pRes = await fetch(`${apiUrl}/portfolios/${portfolioId}`, {
          cache: "no-store",
        });

        if (!pRes.ok) {
          throw new Error("Không tìm thấy tác phẩm hoặc có lỗi xảy ra");
        }
        
        const pJson = await pRes.json();
        const data: PortfolioDetail = pJson.data;

        // Fetch Comments
        const cRes = await fetch(`${apiUrl}/comments/portfolio/${portfolioId}`, {
          cache: "no-store",
        });
        
        if (!isMounted) return;

        setPortfolio(data);
        setLikesCount(data.likesCount || 0);

        if (currentUser) {
          const userId = currentUser._id || currentUser.id;
          if (data.likes && data.likes.includes(userId)) {
            setIsLiked(true);
          }
        }

        if (cRes.ok) {
          const cJson = await cRes.json();
          if (cJson.status === "success") {
            setComments(cJson.data || []);
          }
        }
      } catch (err: any) {
        if (isMounted) setErrorMessage(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [portfolioId, currentUser]);

  const handleToggleLike = async () => {
    if (!isAuthenticated || !currentUser) {
      alert("Vui lòng đăng nhập để thích tác phẩm này.");
      return;
    }

    try {
      // Optimistic Update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/portfolios/${portfolioId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        // Rollback if failed
        setIsLiked(!newIsLiked);
        setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        alert("Lỗi khi tương tác. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async () => {
    if (!isAuthenticated || !currentUser) {
      alert("Vui lòng đăng nhập để bình luận.");
      return;
    }

    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          portfolioId,
          content: commentContent,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        // Backend trả về bình luận mới tạo trong json.data
        const newComment = json.data;
        if (newComment) {
          // Gắn thêm info user hiện tại vào để UI hiện luôn không cần reload
          const formattedComment: Comment = {
            _id: newComment._id,
            content: newComment.content,
            createdAt: newComment.createdAt || new Date().toISOString(),
            user: {
              _id: currentUser._id || currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar,
            }
          };
          
          setComments(prev => [formattedComment, ...prev]);
          setCommentContent("");
        }
      } else {
        alert("Có lỗi khi đăng bình luận.");
      }
    } catch (e) {
      console.error(e);
      alert("Có lỗi khi đăng bình luận.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa bình luận này?");
    if (!confirmDelete) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        // Xóa khỏi UI
        setComments(prev => prev.filter(c => c._id !== commentId));
      } else {
        alert("Không thể xóa bình luận này.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa bình luận.");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <StateBlock type="loading" title="Đang tải tác phẩm..." />
      </main>
    );
  }

  if (errorMessage || !portfolio) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <StateBlock
          type="error"
          title="Không tìm thấy tác phẩm"
          description={errorMessage || "Tác phẩm không tồn tại hoặc đã bị xóa."}
          actionLabel="Quay lại khám phá"
          actionHref="/"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky Top Bar (Back Button) */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-surface/80 backdrop-blur-lg">
        <div className="app-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Link>
          <div className="flex items-center gap-3">
             <span className="flex items-center gap-1.5 text-sm font-semibold text-muted">
               <Eye className="h-4 w-4" /> {portfolio.views?.toLocaleString("vi-VN") || 0}
             </span>
             <button
               onClick={handleToggleLike}
               className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                 isLiked ? "bg-danger/10 text-danger hover:bg-danger/20" : "bg-surface-soft text-muted hover:text-foreground hover:bg-border"
               }`}
             >
               <motion.div animate={{ scale: isLiked ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.3 }}>
                 <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
               </motion.div>
               {likesCount.toLocaleString("vi-VN")}
             </button>
          </div>
        </div>
      </div>

      <div className="app-container py-8 lg:py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] xl:gap-20">
          
          {/* Cột trái: Ảnh tràn viền cực nét */}
          <div className="flex flex-col gap-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="text-4xl font-extrabold sm:text-5xl"
            >
              {portfolio.title}
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-2xl border border-border/50 shadow-2xl"
            >
              {portfolio.images.map((img, idx) => (
                <div key={idx} className="relative w-full">
                  <Image
                    src={img}
                    alt={`${portfolio.title} - ảnh ${idx + 1}`}
                    width={1200}
                    height={800}
                    className="h-auto w-full object-cover"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Cột phải: Sticky Sidebar */}
          <div className="relative">
            <div className="sticky top-24 flex flex-col gap-8">
              
              {/* Tác giả & Info */}
              <motion.section 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="surface rounded-2xl p-6"
              >
                <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                  <Link href={`/profile/${portfolio.user._id}`}>
                    <img
                      src={portfolio.user.avatar || "/next.svg"}
                      alt={portfolio.user.name}
                      className="h-16 w-16 rounded-full border-2 border-border object-cover transition-transform hover:scale-105"
                    />
                  </Link>
                  <div>
                    <h3 className="text-lg font-bold">
                      <Link href={`/profile/${portfolio.user._id}`} className="hover:text-primary transition-colors">
                        {portfolio.user.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted">
                      Ngày đăng: {new Date(portfolio.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Mô tả</h4>
                  <p className="text-foreground leading-relaxed">
                    {portfolio.description || "Tác giả không để lại mô tả."}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="badge border-primary/30 text-primary">{portfolio.category}</span>
                  {portfolio.tags?.map((tag) => (
                    <span key={tag} className="badge">#{tag}</span>
                  ))}
                </div>

                {portfolio.colors && portfolio.colors.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Bảng Màu</h4>
                    <div className="flex gap-2">
                      {portfolio.colors.map((color) => (
                        <div
                          key={color}
                          className="h-8 w-full rounded-md shadow-sm border border-border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.section>

              {/* Bình luận */}
              <motion.section 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="surface rounded-2xl p-6"
              >
                <h3 className="flex items-center gap-2 text-xl font-bold mb-6">
                  <MessageCircle className="h-5 w-5" /> Bình luận ({comments.length})
                </h3>

                {isAuthenticated ? (
                  <div className="flex gap-3 mb-8">
                    <img
                      src={currentUser?.avatar || "/next.svg"}
                      alt="Avatar"
                      className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                    />
                    <div className="flex-1">
                      <textarea
                        rows={2}
                        className="w-full rounded-xl border border-border bg-surface-soft px-4 py-3 text-sm placeholder-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Bạn nghĩ gì về tác phẩm này?"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={handlePostComment}
                          disabled={!commentContent.trim() || isSubmittingComment}
                          className="btn btn-primary h-9 px-4 rounded-lg flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" /> {isSubmittingComment ? "Đang gửi..." : "Gửi"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 rounded-xl border border-border bg-surface-soft p-4 text-center">
                    <p className="text-sm text-muted">Vui lòng <Link href="/login" className="text-primary font-bold hover:underline">đăng nhập</Link> để bình luận.</p>
                  </div>
                )}

                <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
                  {comments.length === 0 ? (
                    <p className="text-center text-sm text-muted">Chưa có bình luận nào.</p>
                  ) : (
                    comments.map((comment) => {
                      const isMyComment = currentUser && (currentUser._id === comment.user._id || currentUser.id === comment.user._id);
                      return (
                        <div key={comment._id} className="group flex gap-3">
                          <Link href={`/profile/${comment.user._id}`}>
                            <img
                              src={comment.user.avatar || "/next.svg"}
                              alt={comment.user.name}
                              className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                            />
                          </Link>
                          <div className="flex-1 rounded-2xl rounded-tl-none bg-surface-soft p-4 relative">
                            <div className="mb-1 flex items-baseline justify-between">
                              <Link href={`/profile/${comment.user._id}`}>
                                <strong className="text-sm font-bold hover:text-primary transition-colors">
                                  {comment.user.name}
                                </strong>
                              </Link>
                              <span className="text-xs text-muted">
                                {formatDistanceToNow(new Date(comment.createdAt), {
                                  addSuffix: true,
                                  locale: vi,
                                })}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                              {comment.content}
                            </p>

                            {/* Nút xóa bình luận */}
                            {isMyComment && (
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="absolute -right-2 -top-2 rounded-full bg-danger text-white p-1.5 shadow-md opacity-0 transition-all hover:scale-110 group-hover:opacity-100"
                                title="Xóa bình luận"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}