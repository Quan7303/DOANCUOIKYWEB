import type { AuthUser } from "../../types/api";

type ProfileHeaderProps = {
  user: AuthUser;
};

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="surface rounded-2xl p-5">
      <div className="flex items-center gap-4">
        {user.avatar && user.avatar !== "default-avatar.png" ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-xl font-bold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        )}

        <div>
          <p className="text-sm font-bold uppercase text-primary">
            Hồ sơ cá nhân
          </p>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
      </div>
    </div>
  );
}