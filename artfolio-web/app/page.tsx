import PortfolioGrid from "./components/PortfolioGrid";
import { getFeaturedPortfolios } from "./data/portfolios";

export const revalidate = 3600;

export default async function Home() {
  const portfolios = await getFeaturedPortfolios();

  return (
    <section className="py-8 sm:py-10">
      <div className="app-container">
        <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase text-primary">
              CreativePortfolio
            </p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Portfolio nổi bật từ cộng đồng sáng tạo
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80">
            <div className="rounded-lg border border-border bg-surface px-3 py-2">
              <strong className="block text-lg">{portfolios.length}</strong>
              <span className="text-xs text-muted">tác phẩm</span>
            </div>
            <div className="rounded-lg border border-border bg-surface px-3 py-2">
              <strong className="block text-lg">5</strong>
              <span className="text-xs text-muted">danh mục</span>
            </div>
            <div className="rounded-lg border border-border bg-surface px-3 py-2">
              <strong className="block text-lg">ISR</strong>
              <span className="text-xs text-muted">cache</span>
            </div>
          </div>
        </div>

        <PortfolioGrid portfolios={portfolios} />
      </div>
    </section>
  );
}
