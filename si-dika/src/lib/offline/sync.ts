// =============================================================================
// SI-DIKA — Sync Orchestrator
// TASK-5.4 (REQ-2.4)
// Memproses antrian PENDING_SYNC dari Dexie ke server.
// =============================================================================

import { getOfflineDB, type OfflineAssessment } from "./db";

export interface SyncResult {
  total:     number;
  created:   number;
  duplicate: number;
  errors:    number;
  failed:    OfflineAssessment[];
}

/**
 * Kirim semua assessment berstatus PENDING_SYNC ke server.
 * Gunakan POST /api/assessments/sync (idempoten via localId).
 * Update status di Dexie sesuai hasil.
 */
export async function syncPendingAssessments(): Promise<SyncResult> {
  const db = getOfflineDB();

  const pending = await db.assessments
    .where("syncStatus")
    .equals("PENDING_SYNC")
    .toArray();

  const result: SyncResult = {
    total:     pending.length,
    created:   0,
    duplicate: 0,
    errors:    0,
    failed:    [],
  };

  if (pending.length === 0) return result;

  // Kirim semuanya dalam satu batch request
  let response: Response;
  try {
    response = await fetch("/api/assessments/sync", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(pending),
    });
  } catch {
    // Network error — tandai semua sebagai error tapi jangan ubah status (coba lagi nanti)
    result.errors = pending.length;
    result.failed = pending;
    return result;
  }

  if (!response.ok) {
    result.errors = pending.length;
    result.failed = pending;
    return result;
  }

  const json = await response.json();
  const serverResults: { localId: string; status: string; error?: string }[] = json.results ?? [];

  // Update status per item di Dexie
  for (const item of serverResults) {
    if (item.status === "created" || item.status === "duplicate") {
      await db.assessments.update(item.localId, {
        syncStatus: "SYNCED",
        syncedAt:   new Date().toISOString(),
        syncError:  undefined,
      });
      if (item.status === "created")   result.created++;
      if (item.status === "duplicate") result.duplicate++;
    } else {
      await db.assessments.update(item.localId, {
        syncStatus: "CONFLICT",
        syncError:  item.error,
      });
      result.errors++;
      const failed = pending.find((p) => p.localId === item.localId);
      if (failed) result.failed.push(failed);
    }
  }

  return result;
}

/**
 * Jumlah assessment yang belum tersinkronisasi.
 */
export async function getPendingCount(): Promise<number> {
  const db = getOfflineDB();
  return db.assessments.where("syncStatus").equals("PENDING_SYNC").count();
}
