"use client";

import Link from "next/link";
import { useAuthStore } from "../store/useAuthStore";

export default function HomeHeroActions() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated || isAuthenticated) {
    return null;
  }

  return (
    <div className="mt-10 flex items-center justify-center">
      <Link
        href="/signup"
        className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 hover:bg-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Tham gia ngay
      </Link>
    </div>
  );
}