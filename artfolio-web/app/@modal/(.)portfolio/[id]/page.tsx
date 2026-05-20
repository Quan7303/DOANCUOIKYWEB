import { notFound } from "next/navigation";
import Modal from "../../../components/Modal";
import PortfolioDetail from "../../../components/PortfolioDetail";
import { getPortfolioById } from "../../../data/portfolios";

type ModalPortfolioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ModalPortfolioPage({
  params,
}: ModalPortfolioPageProps) {
  const { id } = await params;
  const portfolio = await getPortfolioById(id);

  if (!portfolio) notFound();

  return (
    <Modal>
      <PortfolioDetail portfolio={portfolio} isModal />
    </Modal>
  );
}
