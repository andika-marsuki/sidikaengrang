// =============================================================================
// SI-DIKA — Badge Engine
// TASK-4.4 (REQ-5.2)
// Diisolasi dari UI — dapat dijalankan di server maupun di client (offline).
// =============================================================================

import type { BadgeCode } from "@/types";

export interface BadgeEvalInput {
  fallCount: number;
  trackDistanceM: number;
  scoreStatic: number;
  scoreDynamic: number;
  finalScore: number;
  testType: "PRE_TEST" | "POST_TEST" | "PRACTICE";
}

export interface BadgeResult {
  code: BadgeCode;
  title: string;
  earned: boolean;
}

// ─── Kriteria Badge ───────────────────────────────────────────────────────────

/**
 * ZERO_FALL: tidak jatuh pada lintasan ≥ 15m.
 */
export function checkZeroFall(fallCount: number, trackDistanceM: number): boolean {
  return fallCount === 0 && trackDistanceM >= 15;
}

/**
 * IRON_BALANCE: skor statis DAN dinamis keduanya 4 (sempurna).
 */
export function checkIronBalance(scoreStatic: number, scoreDynamic: number): boolean {
  return scoreStatic === 4 && scoreDynamic === 4;
}

/**
 * MOST_IMPROVED: skor POST_TEST meningkat ≥ 15% dibanding PRE_TEST.
 * Hanya relevan ketika post-test tersedia.
 */
export function checkMostImproved(
  currentScore: number,
  currentTestType: "PRE_TEST" | "POST_TEST" | "PRACTICE",
  priorPreTestScore: number | null
): boolean {
  if (currentTestType !== "POST_TEST") return false;
  if (priorPreTestScore === null || priorPreTestScore <= 0) return false;
  const improvement = (currentScore - priorPreTestScore) / priorPreTestScore;
  return improvement >= 0.15;
}

// ─── Main Evaluator ───────────────────────────────────────────────────────────

/**
 * Evaluasi semua badge berdasarkan hasil assessment yang baru.
 *
 * @param current   - Data assessment yang baru saja selesai
 * @param priorPreTestScore - Skor final PRE_TEST sebelumnya (jika ada)
 * @returns Array BadgeResult — satu entry per badge, `earned: true/false`
 */
export function evaluateBadges(
  current: BadgeEvalInput,
  priorPreTestScore: number | null = null
): BadgeResult[] {
  return [
    {
      code: "ZERO_FALL",
      title: "Kaki Baja",
      earned: checkZeroFall(current.fallCount, current.trackDistanceM),
    },
    {
      code: "IRON_BALANCE",
      title: "Keseimbangan Besi",
      earned: checkIronBalance(current.scoreStatic, current.scoreDynamic),
    },
    {
      code: "MOST_IMPROVED",
      title: "Paling Pesat",
      earned: checkMostImproved(current.finalScore, current.testType, priorPreTestScore),
    },
  ];
}

/**
 * Hanya badge yang earned === true.
 */
export function getEarnedBadges(
  current: BadgeEvalInput,
  priorPreTestScore: number | null = null
): BadgeResult[] {
  return evaluateBadges(current, priorPreTestScore).filter((b) => b.earned);
}
