// =============================================================================
// SI-DIKA — Unit Tests: Speed Norms
// TASK-4.2
// =============================================================================

import { describe, it, expect } from "vitest";
import { getSpeedNorm } from "../speed-norms";

describe("getSpeedNorm", () => {
  // Rentang usia
  it("usia 7 (L) → target 0.35, minimum 0.15", () => {
    const norm = getSpeedNorm(7, "L");
    expect(norm.target).toBe(0.35);
    expect(norm.minimum).toBe(0.15);
  });

  it("usia 9 (L) → masih dalam rentang 7-9", () => {
    const norm = getSpeedNorm(9, "L");
    expect(norm.target).toBe(0.35);
  });

  it("usia 10 (L) → target 0.50", () => {
    const norm = getSpeedNorm(10, "L");
    expect(norm.target).toBe(0.50);
  });

  it("usia 12 (P) → target 0.45", () => {
    const norm = getSpeedNorm(12, "P");
    expect(norm.target).toBe(0.45);
  });

  it("usia 13 (L) → target 0.65", () => {
    const norm = getSpeedNorm(13, "L");
    expect(norm.target).toBe(0.65);
  });

  it("usia 15 (P) → target 0.55", () => {
    const norm = getSpeedNorm(15, "P");
    expect(norm.target).toBe(0.55);
  });

  it("usia 16 (L) → target 0.75", () => {
    const norm = getSpeedNorm(16, "L");
    expect(norm.target).toBe(0.75);
  });

  it("usia 18 (P) → target 0.60", () => {
    const norm = getSpeedNorm(18, "P");
    expect(norm.target).toBe(0.60);
  });

  // Fallback untuk usia di luar tabel
  it("usia 5 (L) → fallback target 0.50", () => {
    const norm = getSpeedNorm(5, "L");
    expect(norm.target).toBe(0.50);
  });

  it("usia 20 (P) → fallback target 0.45", () => {
    const norm = getSpeedNorm(20, "P");
    expect(norm.target).toBe(0.45);
  });

  // L vs P berbeda pada usia yang sama
  it("usia 13: L lebih cepat dari P (target L > target P)", () => {
    const l = getSpeedNorm(13, "L");
    const p = getSpeedNorm(13, "P");
    expect(l.target).toBeGreaterThan(p.target);
  });
});
