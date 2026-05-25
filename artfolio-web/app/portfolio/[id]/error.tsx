"use client";

import StateBlock from "../../components/StateBlock";

type PortfolioErrorProps = {
  reset: () => void;
};

export default function PortfolioError({ reset }: PortfolioErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <StateBlock
        type="error"
        title="Khong the tai tac pham"
        description="Vui long thu lai hoac quay ve trang kham pha."
        actionLabel="Thu lai"
        onAction={reset}
      />
    </main>
  );
}
