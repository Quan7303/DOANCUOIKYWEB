"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import toast from "react-hot-toast";

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing?: boolean;
  onFollowerChange?: (delta: number) => void;
};

export default function FollowButton({
  targetUserId,
  initialFollowing = false,
  onFollowerChange,
}: FollowButtonProps) {
  const { user, isAuthenticated } = useAuthStore();

  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile = user?._id === targetUserId || user?.id === targetUserId;
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  async function handleFollow() {
    if (!isAuthenticated || !user || !token) {
      toast.error("Vui lòng đăng nhập để theo dõi người dùng.");
      return;
    }

    if (isOwnProfile) {
      toast.error("Bạn không thể tự theo dõi chính mình.");
      return;
    }

    const previousFollowing = isFollowing;
    const nextFollowing = !isFollowing;
    const followerDelta = nextFollowing ? 1 : -1;

    // Optimistic update
    setIsFollowing(nextFollowing);
    onFollowerChange?.(followerDelta);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/users/${targetUserId}/follow`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("API call failed");
      }
      
      toast.success(nextFollowing ? "Đã theo dõi người dùng." : "Đã hủy theo dõi.");
    } catch {
      // Rollback
      setIsFollowing(previousFollowing);
      onFollowerChange?.(-followerDelta);
      toast.error("Thao tác thất bại. Đã hoàn tác thay đổi.");
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
    </div>
  );
}