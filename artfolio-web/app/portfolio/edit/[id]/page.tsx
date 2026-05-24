import type { Metadata } from "next";
import EditPortfolioClient from "./EditPortfolioClient";

export const metadata: Metadata = {
  title: "Chỉnh sửa tác phẩm | Artfolio",
  description: "Cập nhật thông tin tác phẩm sáng tạo của bạn.",
};

type EditPortfolioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPortfolioPage({
  params,
}: EditPortfolioPageProps) {
  const { id } = await params;

  return <EditPortfolioClient portfolioId={id} />;
}
