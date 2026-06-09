"use client";

import { useEffect, useState } from "react";
import PortfolioGrid from "./PortfolioGrid";
import { normalizePortfolio, type RawPortfolio } from "../data/portfolios";
import { useAuthStore } from "../store/useAuthStore";
import api from "../utils/api";
import type { PortfolioSummary } from "../types/api";

type JustForYouResponse = {
  data?: unknown[];
  message?: string;
};

export default function JustForYouSection() {
  const { isAuthenticated, isHydrated, accessToken } = useAuthStore();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !accessToken) return;

    let ignore = false;

    async function fetchJustForYou() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await api.get<JustForYouResponse>(
          "/api/portfolios/just-for-you?limit=8",
        );

        if (ignore) return;

        const rawData: RawPortfolio[] = Array.isArray(response.data.data)
          ? (response.data.data as RawPortfolio[])
          : [];

        setPortfolios(rawData.map((item) => normalizePortfolio(item)));
      } catch (error) {
        if (ignore) return;

        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải gợi ý cho bạn.";

        setErrorMessage(message);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchJustForYou();

    return () => {
      ignore = true;
    };
  }, [accessToken, isAuthenticated, isHydrated]);

  if (!isHydrated || !isAuthenticated) return null;

  return (
    <section id="just-for-you" className="border-t border-border/50 py-16 sm:py-24">
      <div className="app-container">
        <div className="mb-10 text-center md:text-left">
          <p className="text-sm font-bold uppercase text-primary">Cá nhân hóa</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Dành cho bạn
          </h2>
          <p className="mt-3 text-lg text-muted">
            Gợi ý dựa trên tác giả bạn theo dõi và tác phẩm bạn yêu thích.
          </p>
        </div>

        <PortfolioGrid
          portfolios={portfolios}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      </div>
    </section>
  );
}
