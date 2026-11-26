"use client";
// =============================================================================
// SI-DIKA — Hook: useSyncQueue
// TASK-5.4 (REQ-2.4)
// Memantau antrian PENDING_SYNC dan memicu sync saat kembali online.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { syncPendingAssessments, getPendingCount, type SyncResult } from "@/lib/offline/sync";

interface SyncState {
  pendingCount: number;
  isSyncing:    boolean;
  lastResult:   SyncResult | null;
  lastError:    string | null;
}

export function useSyncQueue() {
  const isOnline = useOnlineStatus();
  const [state, setState] = useState<SyncState>({
    pendingCount: 0,
    isSyncing:    false,
    lastResult:   null,
    lastError:    null,
  });

  const wasOfflineRef = useRef(!isOnline);

  // Perbarui pendingCount
  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setState((prev) => ({ ...prev, pendingCount: count }));
    } catch {
      // IndexedDB mungkin belum siap
    }
  }, []);

  // Jalankan sync
  const runSync = useCallback(async () => {
    setState((prev) => ({ ...prev, isSyncing: true, lastError: null }));
    try {
      const result = await syncPendingAssessments();
      await refreshCount();
      setState((prev) => ({
        ...prev,
        isSyncing:  false,
        lastResult: result,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: err?.message ?? "Sync gagal",
      }));
    }
  }, [refreshCount]);

  // Refresh count saat mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Jalankan sync saat baru kembali online
  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      runSync();
    }
    wasOfflineRef.current = !isOnline;
  }, [isOnline, runSync]);

  return {
    isOnline,
    ...state,
    refreshCount,
    runSync,
  };
}
