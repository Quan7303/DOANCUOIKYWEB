"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportPortfolioPdf } from "../utils/pdfExport";
import type { PortfolioPdfProfile } from "../types/api";

type ExportPdfButtonProps = {
  profile: PortfolioPdfProfile;
};

export default function ExportPdfButton({ profile }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const canExport = Boolean(profile.name && profile.email);

  const handleExport = async () => {
    if (!canExport) {
      setError("Hồ sơ thiếu tên hoặc email, chưa thể xuất PDF.");
      return;
    }

    setIsExporting(true);
    setError("");

    try {
      await exportPortfolioPdf(profile);
    } catch {
      setError("Không thể xuất PDF. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid gap-2">
      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={handleExport}
        disabled={isExporting || !canExport}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang xuất PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Xuất PDF
          </>
        )}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
