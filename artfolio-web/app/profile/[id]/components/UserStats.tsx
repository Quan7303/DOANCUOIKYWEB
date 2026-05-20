type UserStatsProps = {
  portfoliosCount: number;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
};

export default function UserStats({
  portfoliosCount,
  followersCount,
  followingCount,
  totalLikes,
}: UserStatsProps) {
  const stats = [
    {
      label: "Tác phẩm",
      value: portfoliosCount,
    },
    {
      label: "Follower",
      value: followersCount,
    },
    {
      label: "Following",
      value: followingCount,
    },
    {
      label: "Lượt thích",
      value: totalLikes,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-surface p-4 text-center"
        >
          <p className="text-2xl font-bold text-foreground">
            {item.value.toLocaleString("vi-VN")}
          </p>
          <p className="mt-1 text-sm text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}