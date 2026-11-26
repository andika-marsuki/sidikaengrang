// =============================================================================
// SI-DIKA — Speed Norm Lookup Table
// REQ-4.1 (Komponen Kecepatan 25%)
// Nilai mengacu pada standar tes kebugaran egrang Dikdasmen (design.md §5.2)
// =============================================================================

import type { Gender, SpeedNorm } from "@/types";

interface SpeedNormEntry {
  minAge: number;
  maxAge: number;
  gender: Gender;
  norm: SpeedNorm;
}

/**
 * Tabel norma kecepatan per rentang usia dan jenis kelamin.
 * target: kecepatan ideal untuk mendapat poin penuh (m/s)
 * minimum: kecepatan di bawah ini mendapat 0 poin
 */
const SPEED_NORM_TABLE: SpeedNormEntry[] = [
  // Usia 7–9
  { minAge: 7,  maxAge: 9,  gender: "L", norm: { target: 0.35, minimum: 0.15 } },
  { minAge: 7,  maxAge: 9,  gender: "P", norm: { target: 0.30, minimum: 0.12 } },
  // Usia 10–12
  { minAge: 10, maxAge: 12, gender: "L", norm: { target: 0.50, minimum: 0.25 } },
  { minAge: 10, maxAge: 12, gender: "P", norm: { target: 0.45, minimum: 0.20 } },
  // Usia 13–15
  { minAge: 13, maxAge: 15, gender: "L", norm: { target: 0.65, minimum: 0.35 } },
  { minAge: 13, maxAge: 15, gender: "P", norm: { target: 0.55, minimum: 0.28 } },
  // Usia 16–18 (SMA)
  { minAge: 16, maxAge: 18, gender: "L", norm: { target: 0.75, minimum: 0.40 } },
  { minAge: 16, maxAge: 18, gender: "P", norm: { target: 0.60, minimum: 0.30 } },
];

/**
 * Default fallback untuk usia di luar tabel (< 7 atau > 18).
 */
const DEFAULT_NORM: Record<Gender, SpeedNorm> = {
  L: { target: 0.50, minimum: 0.25 },
  P: { target: 0.45, minimum: 0.20 },
};

/**
 * Mengembalikan norma kecepatan berdasarkan usia (tahun) dan jenis kelamin.
 * @param ageYears Usia dalam tahun (bilangan bulat)
 * @param gender "L" (Laki-laki) atau "P" (Perempuan)
 */
export function getSpeedNorm(ageYears: number, gender: Gender): SpeedNorm {
  const entry = SPEED_NORM_TABLE.find(
    (e) => ageYears >= e.minAge && ageYears <= e.maxAge && e.gender === gender
  );
  return entry?.norm ?? DEFAULT_NORM[gender];
}
