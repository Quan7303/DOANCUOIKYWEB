import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào Artfolio để quản lý portfolio sáng tạo của bạn.",
};

type PageProps = {
  searchParams?: Promise<{
    registered?: string;
    next?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return <LoginPage registered={params?.registered === "1"} nextPath={params?.next} />;
}
