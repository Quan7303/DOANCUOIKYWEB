"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import ExportPdfButton from "./ExportPdfButton";
import type { PortfolioDetail as PortfolioDetailType } from "../types/api";

type PortfolioDetailProps = {
  portfolio: PortfolioDetailType;
  isModal?: boolean;
};

export default function PortfolioDetail({
  portfolio,
  isModal = false,
}: PortfolioDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(portfolio.likesCount);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    "Bố cục rõ, màu chính phụ dễ theo dõi.",
    "Phần trình bày có thể dùng tốt cho demo cuối kỳ.",
  ]);

  const pdfProfile = useMemo(
    () => ({
      name: portfolio.user.name,
      email: `${portfolio.user._id}@artfolio.local`,
      title: portfolio.title,
      skills: ["Visual design", "Portfolio storytelling", "Responsive UI"],
      experience: [
        "Xây dựng portfolio theo hướng trình bày sản phẩm sáng tạo.",
        "Chuẩn bị UI slot cho like, comment, follow và AI palette analysis.",
      ],
      socialLinks: ["https://github.com/artfolio", "https://artfolio.local"],
      works: [
        {
          title: portfolio.title,
          category: portfolio.category,
          description: portfolio.description,
        },
      ],
    }),
    [portfolio],
  );

  const handleLike = () => {
    setLikesCount((current) => current + (isLiked ? -1 : 1));
    setIsLiked((current) => !current);
  };

  const handleComment = () => {
    const value = comment.trim();
    if (!value) return;
    setComments((current) => [value, ...current]);
    setComment("");
  };

  return (
    <article className={isModal ? "grid gap-5" : "grid gap-6 py-8"}>
      {!isModal && (
        <nav className="text-sm text-muted">
          <Link href="/" className="font-semibold hover:text-primary">
            Trang chủ
          </Link>{" "}
          /{" "}
          <Link href="/portfolios" className="font-semibold hover:text-primary">
            Portfolio
          </Link>{" "}
          / <span>{portfolio.title}</span>
        </nav>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-surface-soft">
            <Image
              src={portfolio.images[0]}
              alt={portfolio.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 820px"
              className="object-cover"
            />
          </div>

          <section className="grid gap-3 rounded-lg border border-border bg-surface p-5">
            <div className="flex flex-wrap gap-2">
              <span className="badge">{portfolio.category}</span>
              {portfolio.tags.map((tag) => (
                <span className="badge" key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {portfolio.title}
            </h1>
            <p className="leading-7 text-muted">{portfolio.description}</p>
          </section>

          <section className="grid gap-3 rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Bình luận</h2>
              <span className="text-sm text-muted">{comments.length} mục</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Viết bình luận..."
              />
              <button
                type="button"
                className="btn btn-secondary sm:w-28"
                onClick={handleComment}
              >
                Gửi
              </button>
            </div>
            <div className="grid gap-2">
              {comments.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-lg border border-border bg-surface-soft p-3 text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid h-fit gap-4 rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            {portfolio.user.avatar ? (
              <Image
                src={portfolio.user.avatar}
                alt={portfolio.user.name}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary font-bold text-white">
                {portfolio.user.name.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="font-bold">{portfolio.user.name}</p>
              <p className="text-sm text-muted">
                {new Date(portfolio.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-surface-soft p-3 text-center">
              <strong className="block text-xl">{portfolio.views.toLocaleString("vi-VN")}</strong>
              <span className="text-xs text-muted">lượt xem</span>
            </div>
            <div className="rounded-lg border border-border bg-surface-soft p-3 text-center">
              <strong className="block text-xl">{likesCount.toLocaleString("vi-VN")}</strong>
              <span className="text-xs text-muted">lượt thích</span>
            </div>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              className={isLiked ? "btn btn-primary" : "btn btn-secondary"}
              onClick={handleLike}
            >
              {isLiked ? "Đã thích" : "Thích"}
            </button>
            <button type="button" className="btn btn-secondary">
              Theo dõi
            </button>
            <button type="button" className="btn btn-secondary">
              Phân tích màu AI
            </button>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-bold">Bảng màu</p>
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

          <ExportPdfButton profile={pdfProfile} />
        </aside>
      </div>
    </article>
  );
}
