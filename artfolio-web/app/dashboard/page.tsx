import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardGuard from "./DashboardGuard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Quản lý hồ sơ cá nhân và portfolio của bạn trên Artfolio.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardGuard />
    </Suspense>
  );
}