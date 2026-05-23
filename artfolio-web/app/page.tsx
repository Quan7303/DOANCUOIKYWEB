import PortfolioGrid from "./components/PortfolioGrid";
import { getFeaturedPortfolios } from "./data/portfolios";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const portfolios = await getFeaturedPortfolios();

  return (
    <main className="min-h-screen bg-background">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32 lg:pb-32 lg:pt-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        
        <div className="app-container text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="bg-gradient-to-br from-foreground to-muted bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl">
              Khám Phá Sức Sáng Tạo <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Vô Tận
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Nơi hội tụ những tác phẩm thiết kế, nhiếp ảnh và nghệ thuật đỉnh cao. Chia sẻ portfolio của bạn với cộng đồng sáng tạo trên toàn thế giới.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/signup"
                className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all hover:scale-105"
              >
                Tham gia ngay
              </a>
              <a href="#explore" className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors">
                Khám phá tác phẩm <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Feature Ribbon */}
      <section className="border-y border-border/50 bg-surface/50 backdrop-blur-md py-8">
        <div className="app-container">
          <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            <div className="flex flex-col items-center justify-center gap-1">
              <strong className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">8+</strong>
              <span className="text-sm font-medium text-muted uppercase tracking-wider">Tác phẩm mới</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <strong className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">4</strong>
              <span className="text-sm font-medium text-muted uppercase tracking-wider">Danh mục</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <strong className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">100%</strong>
              <span className="text-sm font-medium text-muted uppercase tracking-wider">MongoDB</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <strong className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">1ms</strong>
              <span className="text-sm font-medium text-muted uppercase tracking-wider">Realtime Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid Section */}
      <section id="explore" className="py-16 sm:py-24">
        <div className="app-container">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Featured Portfolios</h2>
            <p className="mt-3 text-lg text-muted">Những tác phẩm được yêu thích nhất tuần này.</p>
          </div>
          
          <PortfolioGrid portfolios={portfolios} />
        </div>
      </section>
    </main>
  );
}
