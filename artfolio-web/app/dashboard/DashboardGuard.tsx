"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import DashboardClient from "./DashboardClient";
import type { PortfolioSummary } from "../../types/api";

export default function DashboardGuard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [myPortfolios, setMyPortfolios] = useState<PortfolioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user) {
      const fetchMyPortfolios = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          const res = await fetch(`${apiUrl}/portfolios?user=${user._id || user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "success" && data.data) {
              setMyPortfolios(data.data);
            }
          }
        } catch (error) {
          console.error("Failed to fetch my portfolios", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMyPortfolios();
    }
  }, [isAuthenticated, router, user]);

  if (!isAuthenticated || !user || isLoading) {
    // Đang kiểm tra auth hoặc tải dữ liệu
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted">Đang tải dữ liệu từ Database...</p>
        </div>
      </div>
    );
  }

  return <DashboardClient user={user} myPortfolios={myPortfolios} />;
}
