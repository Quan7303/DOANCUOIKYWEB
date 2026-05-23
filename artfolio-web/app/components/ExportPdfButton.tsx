"use client";

import { useState } from "react";
import { exportPortfolioPdf } from "../utils/pdfExport";
import type { PortfolioPdfProfile } from "../types/api";

type ExportPdfButtonProps = {
  profile: PortfolioPdfProfile;
};

export default function ExportPdfButton({ profile }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
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
        disabled={isExporting}
      >
        {isExporting ? "Đang xuất PDF..." : "Xuất PDF"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
