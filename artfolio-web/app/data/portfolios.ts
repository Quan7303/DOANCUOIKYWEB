import type { PortfolioSummary } from "../types/api";
import { getApiUrl } from "../utils/apiConfig";

export async function getPortfolios(limit = 24): Promise<PortfolioSummary[]> {
  try {
    const res = await fetch(getApiUrl(`portfolios?page=1&limit=${limit}`), {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const json = await res.json();

    if (json.status === "success" && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.error("Failed to fetch portfolios from API:", err);
  }

  return [];
}

export async function getFeaturedPortfolios(): Promise<PortfolioSummary[]> {
  return getPortfolios(8);
}
