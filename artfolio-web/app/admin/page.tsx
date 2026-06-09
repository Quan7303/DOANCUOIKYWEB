import { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | Artfolio",
  description: "Trang quản trị Artfolio",
};

export default function AdminPage() {
  return <AdminClient />;
}
