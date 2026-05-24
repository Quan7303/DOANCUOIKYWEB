"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../utils/api";
import DashboardClient from "./DashboardClient";
import type { PortfolioDetail } from "../types/api";

function extractPortfolios(data: unknown): PortfolioDetail[] {
  const value = data as {
    data?: PortfolioDetail[] | { portfolios?: PortfolioDetail[] };
    portfolios?: PortfolioDetail[];
  };

  if (Array.isArray(value)) return value as PortfolioDetail[];
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.data?.portfolios)) return value.data.portfolios;
  if (Array.isArray(value.portfolios)) return value.portfolios;

  return [];
}

export default function DashboardGuard() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, fetchMe } = useAuthStore();
  const userId = user?._id || user?.id;

  const [portfolios, setPortfolios] = useState<PortfolioDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;

    async function checkAuth() {
      if (!isAuthenticated) {
        const currentUser = await fetchMe();

        if (!currentUser) {
          router.replace("/login?next=/dashboard");
        }
      }
    }

    checkAuth();
  }, [isHydrated, isAuthenticated, fetchMe, router]);

  useEffect(() => {
    if (!isHydrated) return;

    async function loadPortfolios() {
      if (!isAuthenticated || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await api.get("/api/portfolios", {
          params: {
            user: userId,
          },
        });

        setPortfolios(extractPortfolios(response.data));
      } catch (error) {
        console.error("Failed to load portfolios:", error);
        setPortfolios([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPortfolios();
  }, [isHydrated, isAuthenticated, userId]);

  if (!isHydrated || isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted">Đang tải portfolio...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <p className="text-sm text-muted">Đang chuyển đến trang đăng nhập...</p>
      </div>
    );
  }

  return <DashboardClient user={user} myPortfolios={portfolios} />;
}
