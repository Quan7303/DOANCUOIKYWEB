"use client";

import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
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

function shouldUseMockApi() {
  return process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const timerId = window.setTimeout(() => {
      const followingIds = readFollowingIds();
      setIsFollowing(followingIds.includes(targetUserId) || initialFollowing);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [targetUserId, initialFollowing]);

  async function callFollowApi() {
    if (shouldUseMockApi()) {
      await delay(350);
      return;
    }

    await api.post(`/api/users/${targetUserId}/follow`);
  }

  async function handleFollow() {
    setMessage("");

    if (!isAuthenticated || !user) {
      setMessage("Vui lòng đăng nhập để theo dõi người dùng.");
      return;
    }

    if (isOwnProfile) {
      setMessage("Bạn không thể tự theo dõi chính mình.");
      return;
    }

    const previousFollowing = isFollowing;
    const nextFollowing = !isFollowing;
    const followerDelta = nextFollowing ? 1 : -1;

    // Optimistic update: cập nhật UI ngay khi click
    setIsFollowing(nextFollowing);
    onFollowerChange?.(followerDelta);
    setIsLoading(true);

    try {
      await callFollowApi();

      const followingIds = readFollowingIds();

      const nextFollowingIds = nextFollowing
        ? Array.from(new Set([...followingIds, targetUserId]))
        : followingIds.filter((id) => id !== targetUserId);

      saveFollowingIds(nextFollowingIds);

      setMessage(
        nextFollowing ? "Đã theo dõi người dùng." : "Đã hủy theo dõi."
      );
    } catch {
      // Rollback nếu API fail
      setIsFollowing(previousFollowing);
      onFollowerChange?.(-followerDelta);
      setMessage("Thao tác thất bại. Đã hoàn tác thay đổi.");
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
        onClick={handleFollow}
      >
        {isOwnProfile
          ? "Hồ sơ của bạn"
          : isLoading
            ? "Đang xử lý..."
            : isFollowing
              ? "Đang theo dõi"
              : "Theo dõi"}
      </button>

      {message && (
        <p className="mt-2 text-center text-sm text-muted">{message}</p>
      )}
    </div>
  );
}