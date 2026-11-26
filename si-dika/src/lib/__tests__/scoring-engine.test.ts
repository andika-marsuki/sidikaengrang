// =============================================================================
// SI-DIKA — Unit Tests: Scoring Engine
// TASK-4.1, TASK-4.3, TASK-8.1
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  calcRubricComponent,
  calcBalanceComponent,
  calcSpeedComponent,
  calcFinalScore,
  getPredicateLabel,
  generateRecommendation,
} from "../scoring-engine";

// ─── calcRubricComponent ──────────────────────────────────────────────────────

describe("calcRubricComponent", () => {
  it("semua skor 4 → 40 poin penuh", () => {
    expect(calcRubricComponent(4, 4, 4, 4)).toBe(40);
  });

  it("semua skor 1 → 10 poin minimum", () => {
    expect(calcRubricComponent(1, 1, 1, 1)).toBe(10);
  });

  it("semua skor 2 → 20 poin", () => {
    expect(calcRubricComponent(2, 2, 2, 2)).toBe(20);
  });

  it("semua skor 3 → 30 poin", () => {
    expect(calcRubricComponent(3, 3, 3, 3)).toBe(30);
  });

  it("campuran: (4+3+2+1)/16*40 = 25", () => {
    expect(calcRubricComponent(4, 3, 2, 1)).toBe(25);
  });

  it("nilai desimal dibulatkan dengan benar", () => {
    // (4+4+4+3)/16*40 = 15/16*40 = 37.5
    expect(calcRubricComponent(4, 4, 4, 3)).toBe(37.5);
  });
});

// ─── calcBalanceComponent ─────────────────────────────────────────────────────

describe("calcBalanceComponent", () => {
  it("tidak jatuh → 35 poin penuh", () => {
    expect(calcBalanceComponent(0)).toBe(35);
  });

  it("1 jatuh → 30", () => {
    expect(calcBalanceComponent(1)).toBe(30);
  });

  it("7 jatuh → 0 (habis penalti)", () => {
    expect(calcBalanceComponent(7)).toBe(0);
  });

  it("lebih dari 7 jatuh → tidak pernah negatif", () => {
    expect(calcBalanceComponent(10)).toBe(0);
    expect(calcBalanceComponent(99)).toBe(0);
  });

  it("3 jatuh → 20", () => {
    expect(calcBalanceComponent(3)).toBe(20);
  });

  it("6 jatuh → 5", () => {
    expect(calcBalanceComponent(6)).toBe(5);
  });
});

// ─── calcSpeedComponent ───────────────────────────────────────────────────────

describe("calcSpeedComponent", () => {
  it("durasi nol → 0 (tidak error)", () => {
    expect(calcSpeedComponent(10, 0, 13, "L")).toBe(0);
  });

  it("durasi negatif → 0", () => {
    expect(calcSpeedComponent(10, -5, 13, "L")).toBe(0);
  });

  it("kecepatan tepat di target norm → ~16.67 poin (1/1.5 * 25)", () => {
    // Usia 13 L: target = 0.65 m/s → jarak 10m, durasi = 10/0.65 s
    const duration = 10 / 0.65;
    const score = calcSpeedComponent(10, duration, 13, "L");
    expect(score).toBeCloseTo(16.67, 1);
  });

  it("kecepatan 1.5× target → 25 poin (cap)", () => {
    // 1.5× target → ratio = 1.5, score = 25 (capped)
    const duration = 10 / (0.65 * 1.5);
    const score = calcSpeedComponent(10, duration, 13, "L");
    expect(score).toBe(25);
  });

  it("kecepatan jauh melebihi norm → tetap 25 (tidak melebihi cap)", () => {
    const score = calcSpeedComponent(10, 1, 13, "L"); // sangat cepat
    expect(score).toBeLessThanOrEqual(25);
    expect(score).toBe(25);
  });

  it("perempuan usia 13 menggunakan norm berbeda dari laki-laki", () => {
    // P target=0.55, L target=0.65; dengan jarak 10m dan durasi 15s
    const scoreL = calcSpeedComponent(10, 15, 13, "L");
    const scoreP = calcSpeedComponent(10, 15, 13, "P");
    expect(scoreP).toBeGreaterThan(scoreL); // P lebih tinggi karena target-nya lebih rendah
  });
});

// ─── getPredicateLabel ────────────────────────────────────────────────────────

describe("getPredicateLabel", () => {
  it("≥85 → Prima", () => {
    expect(getPredicateLabel(85)).toBe("Prima");
    expect(getPredicateLabel(100)).toBe("Prima");
    expect(getPredicateLabel(90)).toBe("Prima");
  });

  it("70–84.9 → Kompeten", () => {
    expect(getPredicateLabel(70)).toBe("Kompeten");
    expect(getPredicateLabel(84.9)).toBe("Kompeten");
    expect(getPredicateLabel(75)).toBe("Kompeten");
  });

  it("55–69.9 → Berkembang", () => {
    expect(getPredicateLabel(55)).toBe("Berkembang");
    expect(getPredicateLabel(69.9)).toBe("Berkembang");
    expect(getPredicateLabel(60)).toBe("Berkembang");
  });

  it("<55 → Perlu Pendampingan", () => {
    expect(getPredicateLabel(54.9)).toBe("Perlu Pendampingan");
    expect(getPredicateLabel(0)).toBe("Perlu Pendampingan");
    expect(getPredicateLabel(30)).toBe("Perlu Pendampingan");
  });
});

// ─── generateRecommendation ───────────────────────────────────────────────────

describe("generateRecommendation", () => {
  it("semua indikator tinggi + tidak banyak jatuh → kalimat pertahankan", () => {
    const rec = generateRecommendation(4, 4, 4, 4, 0);
    expect(rec).toContain("Pertahankan");
  });

  it("fallCount ≥ 3 → rekomendasi jatuh muncul di awal", () => {
    const rec = generateRecommendation(4, 4, 4, 4, 3);
    expect(rec).toContain("lintasan");
  });

  it("scoreCoord = 1 (terlemah) → rekomendasi koordinasi muncul", () => {
    const rec = generateRecommendation(3, 3, 1, 3, 0);
    expect(rec).toContain("fokus pandang");
  });

  it("scoreStatic = 1 → rekomendasi keseimbangan statis muncul", () => {
    const rec = generateRecommendation(1, 3, 3, 3, 0);
    expect(rec).toContain("keseimbangan statis");
  });

  it("scoreDynamic = 2 → rekomendasi zig-zag muncul", () => {
    const rec = generateRecommendation(3, 2, 3, 3, 0);
    expect(rec).toContain("zig-zag");
  });

  it("scorePosture = 2 → rekomendasi core/plank muncul", () => {
    const rec = generateRecommendation(3, 3, 3, 2, 0);
    expect(rec).toContain("plank");
  });

  it("beberapa indikator lemah → beberapa rekomendasi digabungkan dengan |", () => {
    const rec = generateRecommendation(1, 2, 1, 2, 5);
    expect(rec.split("|").length).toBeGreaterThan(1);
  });
});

// ─── calcFinalScore (integrasi) ───────────────────────────────────────────────

describe("calcFinalScore", () => {
  it("input data Budi seed: Pre-Test → ~39.2 (Perlu Pendampingan)", () => {
    const result = calcFinalScore({
      scoreStatic: 2,
      scoreDynamic: 2,
      scoreCoord: 1,
      scorePosture: 2,
      fallCount: 4,
      durationSeconds: 38,
      trackDistanceM: 10,
      ageYears: 13,
      gender: "L",
    });
    expect(result.finalScore).toBeCloseTo(39.2, 0);
    expect(result.predicate).toBe("Perlu Pendampingan");
  });

  it("input data Budi seed: Post-Test → ~70 (Kompeten)", () => {
    const result = calcFinalScore({
      scoreStatic: 3,
      scoreDynamic: 3,
      scoreCoord: 3,
      scorePosture: 3,
      fallCount: 1,
      durationSeconds: 25,
      trackDistanceM: 10,
      ageYears: 13,
      gender: "L",
    });
    expect(result.finalScore).toBeGreaterThanOrEqual(65);
    expect(["Kompeten", "Berkembang"]).toContain(result.predicate);
  });

  it("input Siti seed: Pre-Test → ≥85 (Prima)", () => {
    const result = calcFinalScore({
      scoreStatic: 4,
      scoreDynamic: 4,
      scoreCoord: 3,
      scorePosture: 3,
      fallCount: 0,
      durationSeconds: 20,
      trackDistanceM: 15,
      ageYears: 13,
      gender: "P",
    });
    expect(result.predicate).toBe("Prima");
    expect(result.finalScore).toBeGreaterThanOrEqual(85);
  });

  it("skor tidak pernah melebihi 100", () => {
    const result = calcFinalScore({
      scoreStatic: 4, scoreDynamic: 4, scoreCoord: 4, scorePosture: 4,
      fallCount: 0, durationSeconds: 1, trackDistanceM: 50,
      ageYears: 13, gender: "L",
    });
    expect(result.finalScore).toBeLessThanOrEqual(100);
  });

  it("komponen dikembalikan dengan benar", () => {
    const result = calcFinalScore({
      scoreStatic: 4, scoreDynamic: 4, scoreCoord: 4, scorePosture: 4,
      fallCount: 0, durationSeconds: 20, trackDistanceM: 15,
      ageYears: 13, gender: "L",
    });
    expect(result.rubricComponent).toBe(40);
    expect(result.balanceComponent).toBe(35);
    expect(result.speedComponent).toBeGreaterThan(0);
  });
});
