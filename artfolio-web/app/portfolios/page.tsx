import PortfolioGrid from "../components/PortfolioGrid";
import { getPortfolios } from "../data/portfolios";

export const dynamic = "force-dynamic";

export default async function PortfoliosPage() {
  const portfolios = await getPortfolios(60);

  return (
    <section className="py-8 sm:py-10">
      <div className="app-container">
        <div className="mb-6 border-b border-border pb-6">
          <p className="mb-2 text-sm font-bold uppercase text-primary">Khám phá</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Danh sách portfolio
          </h1>
        </div>
        <PortfolioGrid portfolios={portfolios} />
      </div>
    </section>
  );
}
