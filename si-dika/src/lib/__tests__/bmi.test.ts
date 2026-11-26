// =============================================================================
// SI-DIKA — Unit Tests: BMI Calculator
// TASK-3.4, TASK-8.1
// =============================================================================

import { describe, it, expect } from "vitest";
import { calcBMI, getBMICategory, recommendStepHeight } from "../bmi";

describe("calcBMI", () => {
  it("160 cm / 55 kg → 21.5", () => {
    expect(calcBMI(160, 55)).toBe(21.5);
  });

  it("170 cm / 70 kg → 24.2", () => {
    expect(calcBMI(170, 70)).toBe(24.2);
  });

  it("150 cm / 40 kg → 17.8", () => {
    expect(calcBMI(150, 40)).toBe(17.8);
  });

  it("tinggi 0 → lempar error", () => {
    expect(() => calcBMI(0, 55)).toThrow();
  });

  it("berat 0 → lempar error", () => {
    expect(() => calcBMI(160, 0)).toThrow();
  });

  it("nilai negatif → lempar error", () => {
    expect(() => calcBMI(-160, 55)).toThrow();
    expect(() => calcBMI(160, -55)).toThrow();
  });
});

describe("getBMICategory", () => {
  it("BMI < 18.5 → Kurang Berat", () => {
    expect(getBMICategory(17.8)).toBe("Kurang Berat");
    expect(getBMICategory(10)).toBe("Kurang Berat");
  });

  it("18.5 ≤ BMI < 25 → Normal", () => {
    expect(getBMICategory(18.5)).toBe("Normal");
    expect(getBMICategory(21.5)).toBe("Normal");
    expect(getBMICategory(24.9)).toBe("Normal");
  });

  it("25 ≤ BMI < 30 → Kelebihan Berat", () => {
    expect(getBMICategory(25)).toBe("Kelebihan Berat");
    expect(getBMICategory(27)).toBe("Kelebihan Berat");
  });

  it("BMI ≥ 30 → Obesitas", () => {
    expect(getBMICategory(30)).toBe("Obesitas");
    expect(getBMICategory(40)).toBe("Obesitas");
  });
});

describe("recommendStepHeight", () => {
  it("tinggi < 130 → pijakan 15-20 cm", () => {
    const rec = recommendStepHeight(120);
    expect(rec.minCm).toBe(15);
    expect(rec.maxCm).toBe(20);
  });

  it("tepat di batas bawah (< 130) → pijakan rendah", () => {
    const rec = recommendStepHeight(129);
    expect(rec.maxCm).toBe(20);
  });

  it("tinggi 130-159 → pijakan 20-30 cm", () => {
    const rec = recommendStepHeight(145);
    expect(rec.minCm).toBe(20);
    expect(rec.maxCm).toBe(30);
  });

  it("tepat 130 → pijakan standar SD/SMP", () => {
    const rec = recommendStepHeight(130);
    expect(rec.minCm).toBe(20);
  });

  it("tinggi ≥ 160 → pijakan 30-40 cm", () => {
    const rec = recommendStepHeight(165);
    expect(rec.minCm).toBe(30);
    expect(rec.maxCm).toBe(40);
  });

  it("tepat 160 → pijakan SMP/SMA", () => {
    const rec = recommendStepHeight(160);
    expect(rec.minCm).toBe(30);
    expect(rec.label).toContain("SMA");
  });
});
