"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDemoPortfolioIds, useAuthStore } from "../store/useAuthStore";
import { portfolios } from "../data/portfolios";
import DashboardClient from "./DashboardClient";

export default function DashboardGuard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    // Đang kiểm tra auth, hiện loading nhẹ
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Lấy portfolio của user đang đăng nhập
  const portfolioIds = getDemoPortfolioIds(user.id);
  const myPortfolios = portfolios.filter((p) => portfolioIds.includes(p._id));

  return <DashboardClient user={user} myPortfolios={myPortfolios} />;
}
