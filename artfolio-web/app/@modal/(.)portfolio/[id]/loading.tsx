import PortfolioModalShell from "../../../components/PortfolioModalShell";
import StateBlock from "../../../components/StateBlock";

export default function PortfolioModalLoading() {
  return (
    <PortfolioModalShell>
      <main className="flex min-h-[70vh] items-center justify-center bg-background">
        <StateBlock type="loading" title="Dang tai tac pham..." />
      </main>
    </PortfolioModalShell>
  );
}
