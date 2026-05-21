import Link from "next/link";

export type PortfolioCardItem = {
  id?: string;
  _id?: string;
  slug?: string;
  title: string;
  description?: string;
  image?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  likesCount?: number;
  views?: number;
  commentsCount?: number;
  comments?: unknown[];
};

type PortfolioCardProps = {
  portfolio: PortfolioCardItem;
  compact?: boolean;
};

function getPortfolioId(portfolio: PortfolioCardItem) {
  return portfolio.slug || portfolio._id || portfolio.id || portfolio.title;
}

function getPortfolioImage(portfolio: PortfolioCardItem) {
  return portfolio.image || portfolio.images?.[0] || "/next.svg";
}

export default function PortfolioCard({
  portfolio,
  compact = false,
}: PortfolioCardProps) {
  const href = `/portfolio/${getPortfolioId(portfolio)}`;
  const image = getPortfolioImage(portfolio);
  const commentsCount = portfolio.commentsCount || portfolio.comments?.length || 0;

  if (compact) {
    return (
      <Link
        href={href}
        className="surface flex gap-4 rounded-xl p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <img
          src={image}
          alt={portfolio.title}
          className="h-20 w-28 rounded-lg object-cover"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold">{portfolio.title}</h3>

          {portfolio.category && (
            <span className="badge mt-2 inline-flex">{portfolio.category}</span>
          )}

          <div className="mt-3 flex gap-3 text-sm text-muted">
            <span>♥ {portfolio.likesCount || 0}</span>
            <span>👁 {portfolio.views || 0}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="surface group overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="aspect-[4/3] overflow-hidden bg-surface-soft">
        <img
          src={image}
          alt={portfolio.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {portfolio.category && (
            <span className="badge">{portfolio.category}</span>
          )}

          {(portfolio.tags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="badge">
              #{tag}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-bold">{portfolio.title}</h3>

        {portfolio.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted">
            {portfolio.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>♥ {portfolio.likesCount || 0}</span>
          <span>{commentsCount} bình luận</span>
        </div>
      </div>
    </Link>
  );
}