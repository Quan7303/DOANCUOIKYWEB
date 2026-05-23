import type { PortfolioSummary } from "../../types/api";

export async function getFeaturedPortfolios(): Promise<PortfolioSummary[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Tạm thời fetch 8 portfolio mới nhất làm featured
    const res = await fetch(`${apiUrl}/portfolios?page=1&limit=8`, {
      cache: "no-store",
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.status === "success" && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.error("Failed to fetch portfolios from API:", err);
  }

  // Trả về mảng rỗng nếu lỗi, tuyệt đối không dùng mock data
  return [];
}
