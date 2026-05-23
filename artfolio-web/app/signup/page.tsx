import type { Metadata } from "next";
import SignupPage from "./SignupPage";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản Artfolio để upload và quản lý portfolio sáng tạo của bạn.",
};

export default function Page() {
  return <SignupPage />;
}
