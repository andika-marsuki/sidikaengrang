"use client";
// =============================================================================
// SI-DIKA — SyncStatusBadge
// TASK-6.4 — Jumlah item pending sync + tombol sync manual
// =============================================================================

import { useSyncQueue } from "@/hooks/useSyncQueue";

export default function SyncStatusBadge() {
  const { isOnline, pendingCount, isSyncing, lastResult, runSync } = useSyncQueue();

  if (!isOnline && pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {pendingCount > 0 && (
        <button
          onClick={runSync}
          disabled={!isOnline || isSyncing}
          title={isOnline ? "Sinkronkan sekarang" : "Offline — tidak bisa sync"}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                     bg-orange-100 text-orange-700 border border-orange-300
                     hover:bg-orange-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSyncing ? (
            <>
              <span className="animate-spin">⟳</span>
              <span>Syncing…</span>
            </>
          ) : (
            <>
              <span>⬆</span>
              <span>{pendingCount} pending</span>
            </>
          )}
        </button>
      )}

      {lastResult && lastResult.created > 0 && pendingCount === 0 && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                         bg-green-100 text-green-700 border border-green-300">
          ✓ Synced
        </span>
      )}
    </div>
  );
}
