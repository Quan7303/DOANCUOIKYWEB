import StateBlock from "../../components/StateBlock";

export default function PortfolioLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <StateBlock type="loading" title="Dang tai tac pham..." />
    </main>
  );
}
