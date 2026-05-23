import Link from "next/link";

type StateBlockProps = {
  type?: "loading" | "empty" | "error" | "unauthorized";
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-surface-soft ${className}`}
    />
  );
}

export default function StateBlock({
  type = "empty",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: StateBlockProps) {
  if (type === "loading") {
    return (
      <div className="surface rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-surface-soft" />

          <div className="flex-1">
            <SkeletonLine className="h-5 w-40" />
            <SkeletonLine className="mt-3 h-4 w-64 max-w-full" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonLine className="h-28" />
          <SkeletonLine className="h-28" />
          <SkeletonLine className="h-28" />
        </div>
      </div>
    );
  }

  const iconMap = {
    empty: "🗂️",
    error: "⚠️",
    unauthorized: "🔒",
  };

  return (
    <div className="surface rounded-2xl p-8 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-soft text-3xl">
        {iconMap[type]}
      </div>

      <h2 className="mt-5 text-2xl font-bold text-foreground">{title}</h2>

      {description && (
        <p className="mx-auto mt-2 max-w-md leading-7 text-muted">
          {description}
        </p>
      )}

      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary mt-6">
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary mt-6" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}