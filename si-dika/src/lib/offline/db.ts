// =============================================================================
// SI-DIKA — Dexie IndexedDB Setup
// TASK-5.2 (REQ-2.3)
// Menyimpan assessment dan data siswa saat offline.
// =============================================================================

import Dexie, { type Table } from "dexie";
import type { SyncStatus, TestType, Gender } from "@/types";

// ─── Tipe data offline ────────────────────────────────────────────────────────

export interface OfflineAssessment {
  /** ID unik dari client (cuid2) — juga digunakan sebagai idempotency key saat sync */
  localId:         string;
  studentId:       string;
  studentName?:    string;    // cache untuk tampilan tanpa network
  egrangSpecId:    string;
  testType:        TestType;
  // Antropometri
  heightCm:        number;
  weightKg:        number;
  bmi:             number;
  // Data lapangan
  trackDistanceM:  number;
  durationSeconds: number;
  fallCount:       number;
  stepCount?:      number;
  // Rubrik
  scoreStatic:     number;
  scoreDynamic:    number;
  scoreCoord:      number;
  scorePosture:    number;
  // Hasil kalkulasi (dihitung di client saat offline)
  finalScore:      number;
  predicate:       string;
  recommendation:  string;
  // Metadata
  assessedAt:      string;    // ISO 8601
  syncStatus:      SyncStatus;
  syncedAt?:       string;    // ISO 8601, diisi saat berhasil sync
  syncError?:      string;    // pesan error jika sync gagal
  createdAt:       string;    // ISO 8601
}

export interface OfflineStudent {
  id:           string;
  nisn:         string;
  name:         string;
  className:    string;
  academicYear: string;
  gender:       Gender;
  birthDate:    string;       // ISO 8601
  cachedAt:     string;       // kapan data ini di-cache
}

// ─── Dexie Database ───────────────────────────────────────────────────────────

export class SIDikaDB extends Dexie {
  assessments!: Table<OfflineAssessment, string>;  // primary key: localId
  students!:    Table<OfflineStudent, string>;      // primary key: id

  constructor() {
    super("SIDikaDB");

    this.version(1).stores({
      // localId sebagai primary key; index tambahan untuk query
      assessments: "localId, studentId, syncStatus, assessedAt, testType",
      students:    "id, nisn, className, academicYear",
    });
  }
}

// Singleton — satu instance per session browser
let _db: SIDikaDB | null = null;

export function getOfflineDB(): SIDikaDB {
  if (typeof window === "undefined") {
    throw new Error("getOfflineDB() hanya bisa dipanggil di browser (Client Component)");
  }
  if (!_db) {
    _db = new SIDikaDB();
  }
  return _db;
}
