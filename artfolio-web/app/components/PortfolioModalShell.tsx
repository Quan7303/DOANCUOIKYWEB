"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type PortfolioModalShellProps = {
  children: ReactNode;
  onClose?: () => void;
};

export default function PortfolioModalShell({
  children,
  onClose,
}: PortfolioModalShellProps) {
  const router = useRouter();
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  function closeModal() {
    if (typeof window !== "undefined") {
      const closeEvent = new CustomEvent("artfolio:portfolio-modal-close-request", {
        cancelable: true,
      });

      window.dispatchEvent(closeEvent);

      if (closeEvent.defaultPrevented) {
        return;
      }
    }

    if (onClose) {
      onClose();
      return;
    }

    router.back();
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 px-3 py-6 backdrop-blur-sm sm:px-6"
      onClick={closeModal}
    >
      <button
        type="button"
        aria-label="Đóng bài viết"
        onClick={closeModal}
        className="fixed right-4 top-4 z-[110] grid h-10 w-10 place-items-center rounded-full bg-white text-slate-900 shadow-lg transition hover:scale-105 hover:bg-slate-100"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="mx-auto min-h-[90vh] max-w-6xl overflow-hidden rounded-2xl bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}