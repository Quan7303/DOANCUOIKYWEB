"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing?: boolean;
  onFollowerChange?: (delta: number) => void;
};

const FOLLOWING_STORAGE_KEY = "artfolio-following-users";

function readFollowingIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(FOLLOWING_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveFollowingIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(ids));
}

export default function FollowButton({
  targetUserId,
  initialFollowing = false,
  onFollowerChange,
}: FollowButtonProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isOwnProfile = user?.id === targetUserId;

  useEffect(() => {
    const followingIds = readFollowingIds();
    setIsFollowing(followingIds.includes(targetUserId) || initialFollowing);
  }, [targetUserId, initialFollowing]);

  async function handleToggleFollow() {
    setMessage("");

    if (!isAuthenticated || !user) {
      setMessage("Vui lòng đăng nhập để theo dõi người dùng.");
      return;
    }

    if (isOwnProfile) {
      setMessage("Bạn không thể tự theo dõi chính mình.");
      return;
    }

    const previousState = isFollowing;
    const nextState = !isFollowing;
    const delta = nextState ? 1 : -1;

    setIsFollowing(nextState);
    onFollowerChange?.(delta);
    setIsLoading(true);

    try {
      // Mock network delay.
      // Sau này thay bằng:
      // await api.post(`/api/users/${targetUserId}/follow`);
      await new Promise((resolve) => setTimeout(resolve, 350));

      const followingIds = readFollowingIds();

      const nextFollowingIds = nextState
        ? Array.from(new Set([...followingIds, targetUserId]))
        : followingIds.filter((id) => id !== targetUserId);

      saveFollowingIds(nextFollowingIds);

      setMessage(nextState ? "Đã theo dõi người dùng." : "Đã hủy theo dõi.");
    } catch {
      setIsFollowing(previousState);
      onFollowerChange?.(-delta);
      setMessage("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={`btn w-full ${
          isFollowing ? "btn-secondary" : "btn-primary"
        }`}
        disabled={isLoading || isOwnProfile}
        onClick={handleToggleFollow}
      >
        {isOwnProfile
          ? "Hồ sơ của bạn"
          : isLoading
            ? "Đang xử lý..."
            : isFollowing
              ? "Đang theo dõi"
              : "Theo dõi"}
      </button>

      {message && <p className="mt-2 text-center text-sm text-muted">{message}</p>}
    </div>
  );
}