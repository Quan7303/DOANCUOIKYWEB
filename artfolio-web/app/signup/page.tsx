import type { Metadata } from "next";
import SignupPage from "./SignupPage";

export const metadata: Metadata = {
  title: "Dang ky",
  description: "Tao tai khoan Artfolio de chia se portfolio sang tao cua ban.",
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
