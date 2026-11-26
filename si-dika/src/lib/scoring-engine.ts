// =============================================================================
// SI-DIKA — Scoring Engine
// REQ-4.1, REQ-4.2, REQ-4.3
// Diisolasi dari UI agar dapat dijalankan di client (offline) maupun server.
// =============================================================================

import type { ScoringInput, ScoringResult, Predicate } from "@/types";
import { getSpeedNorm } from "./speed-norms";

// ─── Komponen Rubrik (40%) ────────────────────────────────────────────────────

/**
 * Menghitung komponen rubrik motorik.
 * Formula: ((statis + dinamis + koordinasi + postur) / 16) * 40
 * @returns nilai 0–40
 */
export function calcRubricComponent(
  scoreStatic: number,
  scoreDynamic: number,
  scoreCoord: number,
  scorePosture: number
): number {
  const raw = scoreStatic + scoreDynamic + scoreCoord + scorePosture;
  return (raw / 16) * 40;
}

// ─── Komponen Keseimbangan & Kontrol (35%) ────────────────────────────────────

/**
 * Menghitung komponen keseimbangan dengan penalti jatuh.
 * Formula: max(0, 35 - fallCount * 5)
 * @returns nilai 0–35
 */
export function calcBalanceComponent(fallCount: number): number {
  return Math.max(0, 35 - fallCount * 5);
}

// ─── Komponen Kecepatan & Daya Tahan (25%) ───────────────────────────────────

/**
 * Menghitung komponen kecepatan berdasarkan norma usia/gender.
 * Formula:
 *   actualSpeed = trackDistanceM / durationSeconds
 *   ratio = min(actualSpeed / norm.target, 1.5)   <- cap 150%
 *   speedScore = min((ratio / 1.5) * 25, 25)
 * @returns nilai 0–25
 */
export function calcSpeedComponent(
  trackDistanceM: number,
  durationSeconds: number,
  ageYears: number,
  gender: "L" | "P"
): number {
  if (durationSeconds <= 0) return 0;
  const actualSpeed = trackDistanceM / durationSeconds;
  const norm = getSpeedNorm(ageYears, gender);
  const ratio = Math.min(actualSpeed / norm.target, 1.5);
  return Math.min((ratio / 1.5) * 25, 25);
}

// ─── Predikat ─────────────────────────────────────────────────────────────────

/**
 * Mengklasifikasikan skor akhir menjadi predikat kebugaran.
 * Sesuai REQ-4.2.
 */
export function getPredicateLabel(finalScore: number): Predicate {
  if (finalScore >= 85) return "Prima";
  if (finalScore >= 70) return "Kompeten";
  if (finalScore >= 55) return "Berkembang";
  return "Perlu Pendampingan";
}

// ─── Rekomendasi Otomatis ─────────────────────────────────────────────────────

interface IndicatorScore {
  key: "scoreStatic" | "scoreDynamic" | "scoreCoord" | "scorePosture";
  value: number;
}

const RECOMMENDATION_MAP: Record<string, string> = {
  scoreCoord:
    "Latihan fokus pandang: tatap titik tetap 5 m ke depan, ayunkan tongkat berirama 1-2-1-2 tanpa melihat kaki.",
  scoreStatic:
    "Latihan keseimbangan statis: berdiri di atas batu bata 10×20 cm selama 10 detik, tingkatkan durasi tiap sesi.",
  scoreDynamic:
    "Latihan lintasan zig-zag ringan dengan tongkat kayu setinggi pinggang sebelum naik engrang.",
  scorePosture:
    "Latihan penguatan core: plank 20 detik × 3 set, dan latihan genggaman dengan bola tenis.",
  fallCount:
    "Kurangi jarak lintasan ke 5 m, fokus pada mounting (naik ke pijakan) hingga stabil sebelum menambah jarak.",
};

/**
 * Menghasilkan narasi rekomendasi latihan perbaikan.
 * Rekomendasi diurutkan dari indikator rubrik yang terlemah.
 * Sesuai REQ-4.3.
 */
export function generateRecommendation(
  scoreStatic: number,
  scoreDynamic: number,
  scoreCoord: number,
  scorePosture: number,
  fallCount: number
): string {
  const recommendations: string[] = [];

  // Periksa penalti jatuh lebih dulu (paling berdampak pada keamanan)
  if (fallCount >= 3) {
    recommendations.push(RECOMMENDATION_MAP.fallCount);
  }

  // Urutkan indikator rubrik dari yang terlemah
  const indicators: IndicatorScore[] = [
    { key: "scoreCoord",   value: scoreCoord },
    { key: "scoreStatic",  value: scoreStatic },
    { key: "scoreDynamic", value: scoreDynamic },
    { key: "scorePosture", value: scorePosture },
  ];

  // Sortir ascending (terlemah dulu)
  indicators.sort((a, b) => a.value - b.value);

  for (const indicator of indicators) {
    if (indicator.value <= 2) {
      recommendations.push(RECOMMENDATION_MAP[indicator.key]);
    }
  }

  if (recommendations.length === 0) {
    return "Pertahankan performa yang sudah baik. Tingkatkan jarak lintasan secara bertahap untuk tantangan lebih tinggi.";
  }

  return recommendations.join(" | ");
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

/**
 * Menghitung seluruh komponen skor dan mengembalikan ScoringResult lengkap.
 * Ini adalah fungsi utama yang dipanggil oleh API dan komponen offline.
 */
export function calcFinalScore(input: ScoringInput): ScoringResult {
  const rubricComponent = calcRubricComponent(
    input.scoreStatic,
    input.scoreDynamic,
    input.scoreCoord,
    input.scorePosture
  );

  const balanceComponent = calcBalanceComponent(input.fallCount);

  const speedComponent = calcSpeedComponent(
    input.trackDistanceM,
    input.durationSeconds,
    input.ageYears,
    input.gender
  );

  const finalScore = Math.min(
    100,
    Math.round((rubricComponent + balanceComponent + speedComponent) * 10) / 10
  );

  const predicate = getPredicateLabel(finalScore);

  const recommendation = generateRecommendation(
    input.scoreStatic,
    input.scoreDynamic,
    input.scoreCoord,
    input.scorePosture,
    input.fallCount
  );

  return {
    rubricComponent: Math.round(rubricComponent * 10) / 10,
    balanceComponent,
    speedComponent: Math.round(speedComponent * 10) / 10,
    finalScore,
    predicate,
    recommendation,
  };
}
