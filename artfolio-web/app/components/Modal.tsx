"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
};

export default function Modal({ children }: ModalProps) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-3"
      role="dialog"
      aria-modal="true"
      onClick={() => router.back()}
    >
      <div
        className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-lg border border-border bg-background p-4 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            className="btn btn-secondary h-10 w-10 px-0"
            onClick={() => router.back()}
            aria-label="Đóng modal"
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
