import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào Artfolio để quản lý portfolio sáng tạo của bạn.",
};

export default function Page() {
  return <LoginPage />;
}
