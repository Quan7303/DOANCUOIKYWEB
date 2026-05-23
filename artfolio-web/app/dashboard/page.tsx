import type { Metadata } from "next";
import DashboardGuard from "./DashboardGuard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Quản lý hồ sơ cá nhân và portfolio của bạn trên Artfolio.",
};

export default function DashboardPage() {
  return <DashboardGuard />;
}
