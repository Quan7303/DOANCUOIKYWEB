"use client";

import { WifiOff, RotateCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Icon */}
      <div className="rounded-full bg-surface p-6">
        <WifiOff className="h-12 w-12 text-muted" />
      </div>

      {/* Title & Description */}
      <div>
        <h1 className="text-3xl font-bold">Bạn đang ngoại tuyến</h1>
        <p className="mt-2 text-base text-muted">
          Vui lòng kiểm tra kết nối Internet của bạn
        </p>
      </div>

      {/* Additional Info */}
      <p className="max-w-sm text-sm text-muted-fg">
        CreativePortfolio hiện không thể kết nối được. Hãy bật lại mạng hoặc
        thử lại để tiếp tục.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleRetry}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90 active:scale-95"
        >
          <RotateCw size={18} />
          Thử lại
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-semibold text-foreground transition hover:bg-surface-soft active:scale-95"
        >
          <Home size={18} />
          Trang chủ
        </Link>
      </div>

      {/* Tips */}
      <div className="mt-6 max-w-sm rounded-lg border border-border bg-surface-soft p-4 text-sm">
        <p className="font-semibold text-foreground">Mẹo:</p>
        <ul className="mt-2 space-y-1 text-left text-muted">
          <li>✓ Kiểm tra WiFi hoặc dữ liệu di động</li>
          <li>✓ Vô hiệu hóa VPN hoặc proxy nếu có</li>
          <li>✓ Khởi động lại thiết bị của bạn</li>
        </ul>
      </div>
    </div>
  );
}
