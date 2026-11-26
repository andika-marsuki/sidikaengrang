// =============================================================================
// SI-DIKA — API Route: POST /api/assessments/sync
// TASK-5.1 (REQ-2.4)
// Menerima array assessment dari Dexie, proses idempoten via localId.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";
import { calcFinalScore } from "@/lib/scoring-engine";
import { calcBMI } from "@/lib/bmi";
import { getEarnedBadges } from "@/lib/badge-engine";
import { createId } from "@paralleldrive/cuid2";
import type { TestType } from "@prisma/client";

const syncItemSchema = z.object({
  localId:         z.string().min(1),
  studentId:       z.string().min(1),
  egrangSpecId:    z.string().min(1),
  testType:        z.enum(["PRE_TEST", "POST_TEST", "PRACTICE"]),
  heightCm:        z.number().min(50).max(250),
  weightKg:        z.number().min(10).max(200),
  trackDistanceM:  z.number().min(5).max(100),
  durationSeconds: z.number().min(1).max(3600),
  fallCount:       z.number().int().min(0).max(99),
  stepCount:       z.number().int().min(0).optional(),
  scoreStatic:     z.number().int().min(1).max(4),
  scoreDynamic:    z.number().int().min(1).max(4),
  scoreCoord:      z.number().int().min(1).max(4),
  scorePosture:    z.number().int().min(1).max(4),
  assessedAt:      z.string().datetime(),
});

type SyncItemStatus = "created" | "duplicate" | "error";

interface SyncItemResult {
  localId: string;
  status:  SyncItemStatus;
  error?:  string;
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER"]);

    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Payload harus berupa array" }, { status: 400 });
    }

    const results: SyncItemResult[] = [];

    for (const item of body) {
      const parsed = syncItemSchema.safeParse(item);
      if (!parsed.success) {
        results.push({
          localId: item?.localId ?? "unknown",
          status:  "error",
          error:   "Validasi gagal: " + JSON.stringify(parsed.error.flatten()),
        });
        continue;
      }

      const data = parsed.data;

      // Idempotency check
      const existing = await prisma.assessment.findUnique({ where: { localId: data.localId } });
      if (existing) {
        results.push({ localId: data.localId, status: "duplicate" });
        continue;
      }

      try {
        const student = await prisma.student.findUnique({ where: { id: data.studentId } });
        if (!student) {
          results.push({ localId: data.localId, status: "error", error: "Siswa tidak ditemukan" });
          continue;
        }

        const assessedAt = new Date(data.assessedAt);
        let ageYears = assessedAt.getFullYear() - student.birthDate.getFullYear();
        const m = assessedAt.getMonth() - student.birthDate.getMonth();
        if (m < 0 || (m === 0 && assessedAt.getDate() < student.birthDate.getDate())) ageYears--;

        const scoring = calcFinalScore({
          scoreStatic:     data.scoreStatic,
          scoreDynamic:    data.scoreDynamic,
          scoreCoord:      data.scoreCoord,
          scorePosture:    data.scorePosture,
          fallCount:       data.fallCount,
          durationSeconds: data.durationSeconds,
          trackDistanceM:  data.trackDistanceM,
          ageYears,
          gender: student.gender as "L" | "P",
        });

        const bmi = calcBMI(data.heightCm, data.weightKg);

        let priorPreTestScore: number | null = null;
        if (data.testType === "POST_TEST") {
          const prior = await prisma.assessment.findFirst({
            where: { studentId: data.studentId, testType: "PRE_TEST" },
            orderBy: { assessedAt: "asc" },
            select: { finalScore: true },
          });
          priorPreTestScore = prior?.finalScore ?? null;
        }

        await prisma.assessment.create({
          data: {
            id:              createId(),
            localId:         data.localId,
            studentId:       data.studentId,
            teacherId:       user.id,
            egrangSpecId:    data.egrangSpecId,
            testType:        data.testType as TestType,
            heightCm:        data.heightCm,
            weightKg:        data.weightKg,
            bmi,
            trackDistanceM:  data.trackDistanceM,
            durationSeconds: data.durationSeconds,
            fallCount:       data.fallCount,
            stepCount:       data.stepCount,
            scoreStatic:     data.scoreStatic,
            scoreDynamic:    data.scoreDynamic,
            scoreCoord:      data.scoreCoord,
            scorePosture:    data.scorePosture,
            finalScore:      scoring.finalScore,
            predicate:       scoring.predicate,
            recommendation:  scoring.recommendation,
            assessedAt,
            syncedAt:        new Date(),
          },
        });

        // Badges
        const earnedBadges = getEarnedBadges(
          {
            fallCount:      data.fallCount,
            trackDistanceM: data.trackDistanceM,
            scoreStatic:    data.scoreStatic,
            scoreDynamic:   data.scoreDynamic,
            finalScore:     scoring.finalScore,
            testType:       data.testType,
          },
          priorPreTestScore
        );

        for (const badge of earnedBadges) {
          try {
            await prisma.studentBadge.create({
              data: {
                id:         createId(),
                studentId:  data.studentId,
                badgeCode:  badge.code,
                badgeTitle: badge.title,
              },
            });
          } catch {
            // Badge already exists — skip
          }
        }

        results.push({ localId: data.localId, status: "created" });
      } catch (err: any) {
        results.push({
          localId: data.localId,
          status:  "error",
          error:   err?.message ?? "Unknown error",
        });
      }
    }

    const created   = results.filter((r) => r.status === "created").length;
    const duplicate = results.filter((r) => r.status === "duplicate").length;
    const errors    = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      summary: { created, duplicate, errors },
      results,
    });
  } catch (error: any) {
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[POST /api/assessments/sync]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
