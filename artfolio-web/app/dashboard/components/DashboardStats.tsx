type DashboardStatsProps = {
  portfoliosCount: number;
  totalLikes: number;
  totalViews: number;
  role?: string;
  isLoading?: boolean;
};

function DashboardStatSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mx-auto h-7 w-16 animate-pulse rounded bg-surface-soft" />
      <div className="mx-auto mt-2 h-4 w-24 animate-pulse rounded bg-surface-soft" />
    </div>
  );
}

export default function DashboardStats({
  portfoliosCount,
  totalLikes,
  totalViews,
  role = "User",
  isLoading = false,
}: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
      </div>
    );
  }

  const stats = [
    {
      label: "Tác phẩm",
      value: portfoliosCount,
    },
    {
      label: "Lượt thích",
      value: totalLikes,
    },
    {
      label: "Lượt xem",
      value: totalViews,
    },
    {
      label: "Vai trò",
      value: role,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-surface p-4 text-center"
        >
          <p className="text-2xl font-bold text-foreground">
            {typeof item.value === "number"
              ? item.value.toLocaleString("vi-VN")
              : item.value}
          </p>
          <p className="mt-1 text-sm text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}