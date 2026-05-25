import type { Metadata } from "next";
import SignupPage from "./SignupPage";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản Artfolio để chia sẻ portfolio sáng tạo của bạn.",
};

type PageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return <SignupPage nextPath={params?.next} />;
}
