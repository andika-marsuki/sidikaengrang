// =============================================================================
// SI-DIKA — API Route: Export PDF per Kelas
// TASK-7.2
// GET /api/export/pdf/[classId]
//   → Download rapor kelas sebagai PDF siap cetak
//
// File ini adalah plain .ts (tanpa JSX).
// Komponen PDF (JSX @react-pdf/renderer) ada di:
//   src/lib/pdf/ClassReportDocument.tsx
// =============================================================================

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import ClassReportDocument from "@/lib/pdf/ClassReportDocument";
import type { AssessmentRow } from "@/lib/pdf/ClassReportDocument";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { calcFinalScore } from "@/lib/scoring-engine";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genderLabel(g: string): string {
  return g === "L" ? "L" : "P";
}

function testTypeLabel(t: string): string {
  const map: Record<string, string> = {
    PRE_TEST: "Pre-Test",
    POST_TEST: "Post-Test",
    PRACTICE: "Praktik",
  };
  return map[t] ?? t;
}

// ─── GET /api/export/pdf/[classId] ───────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);

    const { classId } = await params;
    const className = decodeURIComponent(classId);

    const assessments = await prisma.assessment.findMany({
      where: {
        student: { className, isActive: true },
      },
      include: {
        student: {
          select: {
            nisn: true,
            name: true,
            className: true,
            academicYear: true,
            gender: true,
            birthDate: true,
          },
        },
        teacher: { select: { name: true } },
        egrangSpec: { select: { name: true } },
      },
      orderBy: [
        { student: { name: "asc" } },
        { assessedAt: "asc" },
      ],
    });

    if (assessments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Tidak ada data penilaian untuk kelas ${className}`,
        },
        { status: 404 }
      );
    }

    const teacherName = assessments[0].teacher.name;
    const academicYear = assessments[0].student.academicYear;

    const rows: AssessmentRow[] = assessments.map((a) => {
      const birthDate = a.student.birthDate;
      const assessedAt = a.assessedAt;
      let ageYears = assessedAt.getFullYear() - birthDate.getFullYear();
      const m = assessedAt.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && assessedAt.getDate() < birthDate.getDate())) {
        ageYears--;
      }

      const scoring = calcFinalScore({
        scoreStatic: a.scoreStatic,
        scoreDynamic: a.scoreDynamic,
        scoreCoord: a.scoreCoord,
        scorePosture: a.scorePosture,
        fallCount: a.fallCount,
        durationSeconds: a.durationSeconds,
        trackDistanceM: a.trackDistanceM,
        ageYears,
        gender: a.student.gender as "L" | "P",
      });

      return {
        nisn: a.student.nisn,
        name: a.student.name,
        gender: genderLabel(a.student.gender),
        testType: testTypeLabel(a.testType),
        assessedAt: a.assessedAt.toLocaleDateString("id-ID"),
        teacher: a.teacher.name,
        rubricComponent: scoring.rubricComponent,
        balanceComponent: scoring.balanceComponent,
        speedComponent: scoring.speedComponent,
        finalScore: a.finalScore,
        predicate: a.predicate,
        scoreStatic: a.scoreStatic,
        scoreDynamic: a.scoreDynamic,
        scoreCoord: a.scoreCoord,
        scorePosture: a.scorePosture,
        fallCount: a.fallCount,
        recommendation: a.recommendation,
      };
    });

    const generatedAt = new Date().toLocaleString("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    });

    // Render PDF — cast ke any agar TypeScript menerima element dari .tsx component
    // Buffer dikonversi ke Uint8Array agar kompatibel dengan BodyInit (Web API Response)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(ClassReportDocument, {
      className,
      academicYear,
      teacherName,
      rows,
      generatedAt,
    }) as any;

    const pdfBuffer = await renderToBuffer(element);
    // Salin ke ArrayBuffer baru agar tipe selalu ArrayBuffer (bukan SharedArrayBuffer)
    const arrayBuffer: ArrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer;

    const safeClass = className
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-_]/g, "");
    const filename = `rapor-kelas-${safeClass}.pdf`;

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 401 }
      );
    }
    if (err.code === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 403 }
      );
    }
    console.error("[GET /api/export/pdf]", error);
    return NextResponse.json(
      { success: false, error: "Gagal generate file PDF" },
      { status: 500 }
    );
  }
}
