"use client";

// =============================================================================
// SI-DIKA — ExportButtons Client Component
// TASK-7.3
// Tombol "Ekspor Excel" dan "Ekspor PDF" dengan loading state
// =============================================================================

import { useState } from "react";

interface ExportButtonsProps {
  className: string;
}

export default function ExportButtons({ className }: ExportButtonsProps) {
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encodedClass = encodeURIComponent(className);

  async function handleExport(type: "excel" | "pdf") {
    const setter = type === "excel" ? setLoadingExcel : setLoadingPdf;
    setter(true);
    setError(null);

    try {
      const url = `/api/export/${type}/${encodedClass}`;
      const res = await fetch(url);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error ?? `Gagal mengunduh file ${type.toUpperCase()}`
        );
      }

      // Ambil blob dan trigger download
      const blob = await res.blob();
      const extension = type === "excel" ? "xlsx" : "pdf";
      const safeClass = className.replace(/\s+/g, "-");
      const filename = `rapor-kelas-${safeClass}.${extension}`;

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setter(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {/* Excel Button */}
        <button
          onClick={() => handleExport("excel")}
          disabled={loadingExcel || loadingPdf}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingExcel ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Membuat Excel…
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Ekspor Excel
            </>
          )}
        </button>

        {/* PDF Button */}
        <button
          onClick={() => handleExport("pdf")}
          disabled={loadingExcel || loadingPdf}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingPdf ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Membuat PDF…
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Ekspor PDF
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">⚠ {error}</p>
      )}
    </div>
  );
}
