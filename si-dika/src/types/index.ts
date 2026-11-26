// =============================================================================
// SI-DIKA — Shared TypeScript Types & Enums
// =============================================================================

// ─── Enums (mirror Prisma enums for client-side use) ─────────────────────────

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export type Gender = "L" | "P";

export type TestType = "PRE_TEST" | "POST_TEST" | "PRACTICE";

export type SyncStatus = "PENDING_SYNC" | "SYNCED" | "CONFLICT";

// ─── Badge codes ─────────────────────────────────────────────────────────────

export type BadgeCode = "ZERO_FALL" | "IRON_BALANCE" | "MOST_IMPROVED";

export const BADGE_META: Record<BadgeCode, { title: string; description: string; icon: string }> = {
  ZERO_FALL: {
    title: "Kaki Baja",
    description: "Menyelesaikan lintasan ≥15m tanpa sekalipun kaki menyentuh tanah.",
    icon: "🥇",
  },
  IRON_BALANCE: {
    title: "Keseimbangan Besi",
    description: "Meraih skor sempurna (4) pada keseimbangan statis DAN dinamis.",
    icon: "⚖️",
  },
  MOST_IMPROVED: {
    title: "Paling Pesat",
    description: "Meningkatkan skor akhir ≥15% dibandingkan pre-test.",
    icon: "🚀",
  },
};

// ─── Scoring types ────────────────────────────────────────────────────────────

export interface ScoringInput {
  scoreStatic: number; // 1–4
  scoreDynamic: number; // 1–4
  scoreCoord: number; // 1–4
  scorePosture: number; // 1–4
  fallCount: number;
  durationSeconds: number;
  trackDistanceM: number;
  ageYears: number;
  gender: Gender;
}

export interface ScoringResult {
  rubricComponent: number; // 0–40
  balanceComponent: number; // 0–35
  speedComponent: number; // 0–25
  finalScore: number; // 0–100
  predicate: string;
  recommendation: string;
}

export type Predicate = "Prima" | "Kompeten" | "Berkembang" | "Perlu Pendampingan";

// ─── Assessment payload (used by offline queue & API) ────────────────────────

export interface AssessmentPayload {
  localId: string;
  studentId: string;
  teacherId: string;
  egrangSpecId: string;
  testType: TestType;
  // Antropometri
  heightCm: number;
  weightKg: number;
  bmi: number;
  // Data lapangan
  trackDistanceM: number;
  durationSeconds: number;
  fallCount: number;
  stepCount?: number;
  // Rubrik
  scoreStatic: number;
  scoreDynamic: number;
  scoreCoord: number;
  scorePosture: number;
  // Timestamps
  assessedAt: string; // ISO 8601
}

// ─── Student payload ─────────────────────────────────────────────────────────

export interface StudentPayload {
  nisn: string;
  name: string;
  className: string;
  academicYear: string;
  gender: Gender;
  birthDate: string; // ISO 8601 date string
}

// ─── Auth session extension ───────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// ─── API response wrappers ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Speed norm ──────────────────────────────────────────────────────────────

export interface SpeedNorm {
  target: number; // m/s target untuk poin penuh
  minimum: number; // m/s batas minimum (skor 0)
}
