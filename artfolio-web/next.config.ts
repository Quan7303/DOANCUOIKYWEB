import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  // PWA support: manifest.json và offline page
  // Note: Tùy chế PWA, cần install next-pwa nếu muốn service worker tự động
  // Hiện tại dùng Next.js default PWA support qua manifest.json
  // Nếu cần service worker advanced, install: npm install next-pwa
};

export default nextConfig;
