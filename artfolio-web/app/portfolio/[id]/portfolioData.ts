import type { PortfolioComment, PortfolioDetail } from "../../types/api";
import { getApiUrl } from "../../utils/apiConfig";

type PortfolioDetailData = {
  portfolio: PortfolioDetail | null;
  comments: PortfolioComment[];
  errorMessage: string;
};

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getPortfolioDetailData(
  portfolioId: string,
): Promise<PortfolioDetailData> {
  try {
    const [portfolioResponse, commentsResponse] = await Promise.all([
      fetch(getApiUrl(`portfolios/${portfolioId}`), { cache: "no-store" }),
      fetch(getApiUrl(`comments/portfolio/${portfolioId}`), {
        cache: "no-store",
      }),
    ]);

    const portfolioJson = await readJson(portfolioResponse);

    if (!portfolioResponse.ok || !portfolioJson?.data) {
      return {
        portfolio: null,
        comments: [],
        errorMessage:
          portfolioJson?.message ||
          "Khong tim thay tac pham hoac du lieu khong hop le.",
      };
    }

    const commentsJson = commentsResponse.ok
      ? await readJson(commentsResponse)
      : null;

    return {
      portfolio: portfolioJson.data as PortfolioDetail,
      comments: Array.isArray(commentsJson?.data)
        ? (commentsJson.data as PortfolioComment[])
        : [],
      errorMessage: "",
    };
  } catch {
    return {
      portfolio: null,
      comments: [],
      errorMessage: "Khong the ket noi backend de tai tac pham.",
    };
  }
}
