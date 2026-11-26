// =============================================================================
// SI-DIKA — Unit Tests: Badge Engine
// TASK-4.4
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  checkZeroFall,
  checkIronBalance,
  checkMostImproved,
  evaluateBadges,
  getEarnedBadges,
  type BadgeEvalInput,
} from "../badge-engine";

// ─── checkZeroFall ────────────────────────────────────────────────────────────

describe("checkZeroFall", () => {
  it("tidak jatuh + lintasan 15m → earned", () => {
    expect(checkZeroFall(0, 15)).toBe(true);
  });

  it("tidak jatuh + lintasan 20m → earned", () => {
    expect(checkZeroFall(0, 20)).toBe(true);
  });

  it("tidak jatuh + lintasan 10m (< 15) → tidak earned", () => {
    expect(checkZeroFall(0, 10)).toBe(false);
  });

  it("1 jatuh + lintasan 15m → tidak earned", () => {
    expect(checkZeroFall(1, 15)).toBe(false);
  });

  it("1 jatuh + lintasan 10m → tidak earned", () => {
    expect(checkZeroFall(1, 10)).toBe(false);
  });

  it("tepat 0 jatuh + tepat 15m → earned (batas inklusif)", () => {
    expect(checkZeroFall(0, 15)).toBe(true);
  });
});

// ─── checkIronBalance ────────────────────────────────────────────────────────

describe("checkIronBalance", () => {
  it("statis=4 dan dinamis=4 → earned", () => {
    expect(checkIronBalance(4, 4)).toBe(true);
  });

  it("statis=4 tapi dinamis=3 → tidak earned", () => {
    expect(checkIronBalance(4, 3)).toBe(false);
  });

  it("statis=3 dan dinamis=4 → tidak earned", () => {
    expect(checkIronBalance(3, 4)).toBe(false);
  });

  it("keduanya 3 → tidak earned", () => {
    expect(checkIronBalance(3, 3)).toBe(false);
  });

  it("keduanya 1 → tidak earned", () => {
    expect(checkIronBalance(1, 1)).toBe(false);
  });
});

// ─── checkMostImproved ───────────────────────────────────────────────────────

describe("checkMostImproved", () => {
  it("POST_TEST meningkat tepat 15% → earned", () => {
    expect(checkMostImproved(57.5, "POST_TEST", 50)).toBe(true);
  });

  it("POST_TEST meningkat lebih dari 15% → earned", () => {
    expect(checkMostImproved(70, "POST_TEST", 50)).toBe(true);
  });

  it("POST_TEST meningkat kurang dari 15% → tidak earned", () => {
    expect(checkMostImproved(57, "POST_TEST", 50)).toBe(false);
  });

  it("PRE_TEST (bukan POST_TEST) → tidak earned meskipun skor tinggi", () => {
    expect(checkMostImproved(90, "PRE_TEST", 50)).toBe(false);
  });

  it("PRACTICE → tidak earned", () => {
    expect(checkMostImproved(90, "PRACTICE", 50)).toBe(false);
  });

  it("priorPreTestScore null → tidak earned", () => {
    expect(checkMostImproved(90, "POST_TEST", null)).toBe(false);
  });

  it("priorPreTestScore 0 → tidak earned (hindari divisi-by-zero)", () => {
    expect(checkMostImproved(90, "POST_TEST", 0)).toBe(false);
  });

  it("Budi seed: pre=39.2, post=70.3 → peningkatan ~79% → earned", () => {
    expect(checkMostImproved(70.3, "POST_TEST", 39.2)).toBe(true);
  });
});

// ─── evaluateBadges (integrasi) ───────────────────────────────────────────────

describe("evaluateBadges", () => {
  const baseSiti: BadgeEvalInput = {
    fallCount: 0,
    trackDistanceM: 15,
    scoreStatic: 4,
    scoreDynamic: 4,
    finalScore: 92.7,
    testType: "PRE_TEST",
  };

  it("Siti seed: ZERO_FALL ✓, IRON_BALANCE ✓, MOST_IMPROVED ✗ (bukan post-test)", () => {
    const results = evaluateBadges(baseSiti, null);
    const byCode = Object.fromEntries(results.map((r) => [r.code, r.earned]));
    expect(byCode.ZERO_FALL).toBe(true);
    expect(byCode.IRON_BALANCE).toBe(true);
    expect(byCode.MOST_IMPROVED).toBe(false);
  });

  it("Budi seed: post-test dengan prior 39.2 → MOST_IMPROVED ✓", () => {
    const budiBpost: BadgeEvalInput = {
      fallCount: 1,
      trackDistanceM: 10,
      scoreStatic: 3,
      scoreDynamic: 3,
      finalScore: 70.3,
      testType: "POST_TEST",
    };
    const results = evaluateBadges(budiBpost, 39.2);
    const byCode = Object.fromEntries(results.map((r) => [r.code, r.earned]));
    expect(byCode.MOST_IMPROVED).toBe(true);
    expect(byCode.ZERO_FALL).toBe(false);  // jatuh 1 kali
    expect(byCode.IRON_BALANCE).toBe(false); // tidak keduanya 4
  });

  it("evaluateBadges selalu mengembalikan 3 entries", () => {
    const results = evaluateBadges(baseSiti, null);
    expect(results).toHaveLength(3);
  });

  it("semua badges: kode tersedia di setiap entry", () => {
    const results = evaluateBadges(baseSiti, null);
    const codes = results.map((r) => r.code);
    expect(codes).toContain("ZERO_FALL");
    expect(codes).toContain("IRON_BALANCE");
    expect(codes).toContain("MOST_IMPROVED");
  });
});

// ─── getEarnedBadges ─────────────────────────────────────────────────────────

describe("getEarnedBadges", () => {
  it("hanya mengembalikan badge yang earned", () => {
    const input: BadgeEvalInput = {
      fallCount: 0,
      trackDistanceM: 15,
      scoreStatic: 4,
      scoreDynamic: 4,
      finalScore: 92.7,
      testType: "PRE_TEST",
    };
    const earned = getEarnedBadges(input, null);
    expect(earned.every((b) => b.earned)).toBe(true);
    expect(earned.length).toBe(2); // ZERO_FALL + IRON_BALANCE
  });

  it("tidak ada yang earned → array kosong", () => {
    const input: BadgeEvalInput = {
      fallCount: 5,
      trackDistanceM: 10,
      scoreStatic: 2,
      scoreDynamic: 2,
      finalScore: 40,
      testType: "PRE_TEST",
    };
    const earned = getEarnedBadges(input, null);
    expect(earned).toHaveLength(0);
  });
});
