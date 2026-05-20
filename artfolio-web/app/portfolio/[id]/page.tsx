import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PortfolioDetail from "../../components/PortfolioDetail";
import { getPortfolioById } from "../../data/portfolios";

export const revalidate = 3600;

type PortfolioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { id } = await params;
  const portfolio = await getPortfolioById(id);

  if (!portfolio) {
    return {
      title: "Portfolio không tồn tại",
    };
  }

  return {
    title: portfolio.title,
    description: portfolio.description,
  };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { id } = await params;
  const portfolio = await getPortfolioById(id);

  if (!portfolio) notFound();

  return (
    <section>
      <div className="app-container">
        <PortfolioDetail portfolio={portfolio} />
      </div>
    </section>
  );
}
