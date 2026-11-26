"use client";
// =============================================================================
// SI-DIKA — OfflineBanner
// TASK-6.4 — Banner merah di atas saat offline
// =============================================================================

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="w-full bg-red-600 text-white text-sm font-semibold text-center py-2 px-4 z-50"
    >
      ⚠️ Tidak ada koneksi internet — data penilaian disimpan lokal dan akan disinkronkan saat online kembali.
    </div>
  );
}
