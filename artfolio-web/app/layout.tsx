import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ThemeInitializer from "./components/ThemeInitializer";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Artfolio",
    template: "%s | Artfolio",
  },
  description: "Chia sẻ và khám phá tác phẩm từ các designer, artist, photographer và creator tài năng",
  applicationName: "CreativePortfolio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Artfolio",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  keywords: [
    "portfolio",
    "creative",
    "design",
    "art",
    "photo",
    "3d",
    "creator",
    "artfolio",
  ],
  authors: [{ name: "Int1334 Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("artfolio-theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",t?t==="dark":d)}catch(e){}`,
          }}
        />
        <ServiceWorkerRegister />
        <ThemeInitializer />
        <Navbar />
        <main className="flex-1">{children}</main>
        {modal}
        <Footer />
      </body>
    </html>
  );
}