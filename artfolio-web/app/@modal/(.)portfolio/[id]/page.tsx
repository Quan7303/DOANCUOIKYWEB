import PortfolioModalShell from "../../../components/PortfolioModalShell";
import PortfolioDetailClient from "../../../portfolio/[id]/PortfolioDetailClient";
import { getPortfolioDetailData } from "../../../portfolio/[id]/portfolioData";

type PortfolioModalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PortfolioModalPage({
  params,
}: PortfolioModalPageProps) {
  const { id } = await params;
  const { portfolio, comments, errorMessage } = await getPortfolioDetailData(id);

  return (
    <PortfolioModalShell>
      <PortfolioDetailClient
        portfolioId={id}
        mode="modal"
        initialPortfolio={portfolio}
        initialComments={comments}
        initialErrorMessage={errorMessage}
      />
    </PortfolioModalShell>
  );
}
