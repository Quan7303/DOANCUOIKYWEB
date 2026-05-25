import PortfolioDetailClient from "./PortfolioDetailClient";
import { getPortfolioDetailData } from "./portfolioData";

export const dynamic = "force-dynamic";

type PortfolioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { id } = await params;
  const { portfolio, comments, errorMessage } = await getPortfolioDetailData(id);

  return (
    <PortfolioDetailClient
      portfolioId={id}
      initialPortfolio={portfolio}
      initialComments={comments}
      initialErrorMessage={errorMessage}
    />
  );
}
