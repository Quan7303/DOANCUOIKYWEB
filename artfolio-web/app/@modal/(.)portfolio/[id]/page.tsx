import PortfolioDetailClient from "../../../portfolio/[id]/PortfolioDetailClient";

type ModalPortfolioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ModalPortfolioPage({
  params,
}: ModalPortfolioPageProps) {
  const { id } = await params;

  return <PortfolioDetailClient id={id} mode="modal" />;
}