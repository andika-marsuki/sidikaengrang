// =============================================================================
// SI-DIKA — API Route: Assessments
// TASK-5.1
// POST /api/assessments — buat assessment, hitung skor, simpan badge
// GET  /api/assessments  — list assessment (dengan filter)
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { calcFinalScore } from "@/lib/scoring-engine";
import { calcBMI } from "@/lib/bmi";
import { getEarnedBadges } from "@/lib/badge-engine";
import { createId } from "@paralleldrive/cuid2";
import type { TestType } from "@prisma/client";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const assessmentSchema = z.object({
  localId:        z.string().min(1),
  studentId:      z.string().min(1),
  egrangSpecId:   z.string().min(1),
  testType:       z.enum(["PRE_TEST", "POST_TEST", "PRACTICE"]),
  heightCm:       z.number().min(50).max(250),
  weightKg:       z.number().min(10).max(200),
  trackDistanceM: z.number().min(5).max(100),
  durationSeconds:z.number().min(1).max(3600),
  fallCount:      z.number().int().min(0).max(99),
  stepCount:      z.number().int().min(0).optional(),
  scoreStatic:    z.number().int().min(1).max(4),
  scoreDynamic:   z.number().int().min(1).max(4),
  scoreCoord:     z.number().int().min(1).max(4),
  scorePosture:   z.number().int().min(1).max(4),
  assessedAt:     z.string().datetime().optional(),
});

// ─── POST /api/assessments ────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER"]);

    const body = await request.json();
    const parsed = assessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Cek student exist
    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) {
      return NextResponse.json({ success: false, error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // Cek egrangSpec exist
    const egrangSpec = await prisma.egrangSpec.findUnique({ where: { id: data.egrangSpecId } });
    if (!egrangSpec) {
      return NextResponse.json({ success: false, error: "Spesifikasi egrang tidak ditemukan" }, { status: 404 });
    }

    // Idempotency: jika localId sudah ada, kembalikan assessment yang sudah ada
    const existing = await prisma.assessment.findUnique({ where: { localId: data.localId } });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, duplicate: true });
    }

    // Hitung usia saat assessment
    const assessedAt = data.assessedAt ? new Date(data.assessedAt) : new Date();
    const birthDate  = student.birthDate;
    let ageYears = assessedAt.getFullYear() - birthDate.getFullYear();
    const m = assessedAt.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && assessedAt.getDate() < birthDate.getDate())) ageYears--;

    // Scoring
    const scoring = calcFinalScore({
      scoreStatic:    data.scoreStatic,
      scoreDynamic:   data.scoreDynamic,
      scoreCoord:     data.scoreCoord,
      scorePosture:   data.scorePosture,
      fallCount:      data.fallCount,
      durationSeconds:data.durationSeconds,
      trackDistanceM: data.trackDistanceM,
      ageYears,
      gender: student.gender as "L" | "P",
    });

    const bmi = calcBMI(data.heightCm, data.weightKg);

    // Ambil pre-test sebelumnya (untuk MOST_IMPROVED badge)
    let priorPreTestScore: number | null = null;
    if (data.testType === "POST_TEST") {
      const prior = await prisma.assessment.findFirst({
        where: { studentId: data.studentId, testType: "PRE_TEST" },
        orderBy: { assessedAt: "asc" },
        select: { finalScore: true },
      });
      priorPreTestScore = prior?.finalScore ?? null;
    }

    // Buat assessment
    const assessment = await prisma.assessment.create({
      data: {
        id:             createId(),
        localId:        data.localId,
        studentId:      data.studentId,
        teacherId:      user.id,
        egrangSpecId:   data.egrangSpecId,
        testType:       data.testType as TestType,
        heightCm:       data.heightCm,
        weightKg:       data.weightKg,
        bmi,
        trackDistanceM: data.trackDistanceM,
        durationSeconds:data.durationSeconds,
        fallCount:      data.fallCount,
        stepCount:      data.stepCount,
        scoreStatic:    data.scoreStatic,
        scoreDynamic:   data.scoreDynamic,
        scoreCoord:     data.scoreCoord,
        scorePosture:   data.scorePosture,
        finalScore:     scoring.finalScore,
        predicate:      scoring.predicate,
        recommendation: scoring.recommendation,
        assessedAt,
        syncedAt:       new Date(),
      },
    });

    // Evaluasi badge
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

    const newBadges: { code: string; title: string }[] = [];
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
        newBadges.push({ code: badge.code, title: badge.title });
      } catch {
        // Badge sudah ada (unique constraint) — abaikan
      }
    }

    return NextResponse.json(
      {
        success:    true,
        data:       assessment,
        scoring,
        newBadges,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[POST /api/assessments]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/assessments ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "TEACHER", "STUDENT"]);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const testType  = searchParams.get("testType");
    const limit     = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    const assessments = await prisma.assessment.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(testType  ? { testType: testType as TestType } : {}),
      },
      orderBy: { assessedAt: "desc" },
      take: limit,
      include: {
        student:    { select: { name: true, className: true } },
        teacher:    { select: { name: true } },
        egrangSpec: { select: { name: true, stepHeightCm: true } },
      },
    });

    return NextResponse.json({ success: true, data: assessments });
  } catch (error: any) {
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    console.error("[GET /api/assessments]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
