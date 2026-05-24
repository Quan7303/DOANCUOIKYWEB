import type { PortfolioCategory, PortfolioSummary } from "../types/api";
import { getApiUrl } from "../utils/apiConfig";

const validCategories: PortfolioCategory[] = [
  "design",
  "art",
  "photo",
  "3d",
  "other",
];

type RawPortfolio = Partial<PortfolioSummary> & {
  _id?: string;
  id?: string;
  images?: unknown;
  colors?: unknown;
  tags?: unknown;
  likesCount?: unknown;
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    avatar?: string;
  } | null;
};

function normalizeCategory(category: unknown): PortfolioCategory {
  if (typeof category === "string" && validCategories.includes(category as PortfolioCategory)) {
    return category as PortfolioCategory;
  }

  return "other";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

function normalizePortfolio(item: RawPortfolio): PortfolioSummary {
  return {
    _id: item._id || item.id || crypto.randomUUID(),
    title: item.title || "Untitled portfolio",
    images: normalizeStringArray(item.images),
    colors: normalizeStringArray(item.colors),
    category: normalizeCategory(item.category),
    tags: normalizeStringArray(item.tags),
    likesCount: typeof item.likesCount === "number" ? item.likesCount : 0,
    user: {
      _id: item.user?._id || item.user?.id || "",
      name: item.user?.name || "Unknown user",
      avatar:
        item.user?.avatar && item.user.avatar !== "default-avatar.png"
          ? item.user.avatar
          : "",
    },
  };
}

export async function getPortfolios(limit = 24): Promise<PortfolioSummary[]> {
  try {
    const url = getApiUrl(`portfolios?page=1&limit=${limit}`);

    console.log("Fetching portfolios from:", url);

    const res = await fetch(url, {
      cache: "no-store",
    });

    console.log("Portfolio API status:", res.status);

    if (!res.ok) return [];

    const json = await res.json();

    const rawData = Array.isArray(json.data) ? json.data : [];

    console.log("Portfolio count:", rawData.length);

    return rawData.map((item: RawPortfolio) => normalizePortfolio(item));
  } catch (err) {
    console.error("Failed to fetch portfolios from API:", err);
    return [];
  }
}

export async function getFeaturedPortfolios(): Promise<PortfolioSummary[]> {
  return getPortfolios(8);
}