import PortfolioDetailClient from "./PortfolioDetailClient";

type PortfolioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { id } = await params;

  return <PortfolioDetailClient id={id} />;
}