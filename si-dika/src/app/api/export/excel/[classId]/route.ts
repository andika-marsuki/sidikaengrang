// =============================================================================
// SI-DIKA — API Route: Export Excel per Kelas
// TASK-7.1
// GET /api/export/excel/[classId]
//   → Download rapor kelas sebagai workbook Excel 3-sheet (.xlsx)
//
// Sheet 1 "Rekap Kelas"  : satu baris per siswa, kolom agregat
// Sheet 2 "Detail Rubrik": breakdown 4 indikator motorik per siswa
// Sheet 3 "Rekomendasi"  : narasi rekomendasi per siswa
// =============================================================================

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { calcFinalScore } from "@/lib/scoring-engine";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genderLabel(g: string): string {
  return g === "L" ? "Laki-laki" : "Perempuan";
}

function testTypeLabel(t: string): string {
  const map: Record<string, string> = {
    PRE_TEST: "Pre-Test",
    POST_TEST: "Post-Test",
    PRACTICE: "Praktik",
  };
  return map[t] ?? t;
}

// ─── GET /api/export/excel/[classId] ─────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);

    const { classId } = await params;

    // classId di-encode dari className (e.g. "VII-A") — decode dari URL
    const className = decodeURIComponent(classId);

    // Ambil semua assessment untuk siswa di kelas ini
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
        egrangSpec: { select: { name: true, stepHeightCm: true } },
      },
      orderBy: [
        { student: { name: "asc" } },
        { assessedAt: "asc" },
      ],
    });

    if (assessments.length === 0) {
      return NextResponse.json(
        { success: false, error: `Tidak ada data penilaian untuk kelas ${className}` },
        { status: 404 }
      );
    }

    // Hitung komponen skor untuk setiap assessment
    const rows = assessments.map((a) => {
      const birthDate = a.student.birthDate;
      const assessedAt = a.assessedAt;
      let ageYears =
        assessedAt.getFullYear() - birthDate.getFullYear();
      const m = assessedAt.getMonth() - birthDate.getMonth();
      if (
        m < 0 ||
        (m === 0 && assessedAt.getDate() < birthDate.getDate())
      )
        ageYears--;

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
        // Identitas
        nisn: a.student.nisn,
        name: a.student.name,
        className: a.student.className,
        academicYear: a.student.academicYear,
        gender: genderLabel(a.student.gender),
        testType: testTypeLabel(a.testType),
        assessedAt: a.assessedAt.toLocaleDateString("id-ID"),
        teacher: a.teacher.name,
        egrangSpec: a.egrangSpec.name,

        // Skor komponen
        rubricComponent: +scoring.rubricComponent.toFixed(2),
        balanceComponent: +scoring.balanceComponent.toFixed(2),
        speedComponent: +scoring.speedComponent.toFixed(2),
        finalScore: +a.finalScore.toFixed(2),
        predicate: a.predicate,

        // Detail rubrik
        scoreStatic: a.scoreStatic,
        scoreDynamic: a.scoreDynamic,
        scoreCoord: a.scoreCoord,
        scorePosture: a.scorePosture,

        // Rekomendasi
        recommendation: a.recommendation,
      };
    });

    // ── Sheet 1: Rekap Kelas ───────────────────────────────────────────────

    const sheet1Data = [
      [
        "NISN",
        "Nama Siswa",
        "Kelas",
        "Tahun Ajaran",
        "Jenis Kelamin",
        "Jenis Tes",
        "Tanggal Tes",
        "Guru Penilai",
        "Spesifikasi Egrang",
        "Komponen Rubrik (maks 40)",
        "Komponen Keseimbangan (maks 35)",
        "Komponen Kecepatan (maks 25)",
        "Skor Akhir (0–100)",
        "Predikat",
      ],
      ...rows.map((r) => [
        r.nisn,
        r.name,
        r.className,
        r.academicYear,
        r.gender,
        r.testType,
        r.assessedAt,
        r.teacher,
        r.egrangSpec,
        r.rubricComponent,
        r.balanceComponent,
        r.speedComponent,
        r.finalScore,
        r.predicate,
      ]),
    ];

    // ── Sheet 2: Detail Rubrik ─────────────────────────────────────────────

    const sheet2Data = [
      [
        "NISN",
        "Nama Siswa",
        "Jenis Tes",
        "Tanggal Tes",
        "Keseimbangan Statis (1–4)",
        "Keseimbangan Dinamis (1–4)",
        "Koordinasi (1–4)",
        "Postur & Daya Tahan (1–4)",
        "Jumlah Jatuh",
        "Durasi (detik)",
        "Jarak Lintasan (m)",
        "Tinggi Badan (cm)",
        "Berat Badan (kg)",
        "BMI",
      ],
      ...rows.map((r) => [
        r.nisn,
        r.name,
        r.testType,
        r.assessedAt,
        r.scoreStatic,
        r.scoreDynamic,
        r.scoreCoord,
        r.scorePosture,
        assessments.find(
          (a) =>
            a.student.nisn === r.nisn &&
            a.assessedAt.toLocaleDateString("id-ID") === r.assessedAt &&
            testTypeLabel(a.testType) === r.testType
        )?.fallCount ?? 0,
        assessments.find(
          (a) =>
            a.student.nisn === r.nisn &&
            a.assessedAt.toLocaleDateString("id-ID") === r.assessedAt &&
            testTypeLabel(a.testType) === r.testType
        )?.durationSeconds ?? 0,
        assessments.find(
          (a) =>
            a.student.nisn === r.nisn &&
            a.assessedAt.toLocaleDateString("id-ID") === r.assessedAt &&
            testTypeLabel(a.testType) === r.testType
        )?.trackDistanceM ?? 10,
        assessments.find(
          (a) =>
            a.student.nisn === r.nisn &&
            a.assessedAt.toLocaleDateString("id-ID") === r.assessedAt &&
            testTypeLabel(a.testType) === r.testType
        )?.heightCm ?? 0,
        assessments.find(
          (a) =>
            a.student.nisn === r.nisn &&
            a.assessedAt.toLocaleDateString("id-ID") === r.assessedAt &&
            testTypeLabel(a.testType) === r.testType
        )?.weightKg ?? 0,
        assessments.find(
          (a) =>
            a.student.nisn === r.nisn &&
            a.assessedAt.toLocaleDateString("id-ID") === r.assessedAt &&
            testTypeLabel(a.testType) === r.testType
        )?.bmi.toFixed(1) ?? 0,
      ]),
    ];

    // ── Sheet 3: Rekomendasi ───────────────────────────────────────────────

    const sheet3Data = [
      ["NISN", "Nama Siswa", "Predikat", "Skor Akhir", "Rekomendasi Latihan"],
      ...rows.map((r) => [
        r.nisn,
        r.name,
        r.predicate,
        r.finalScore,
        r.recommendation,
      ]),
    ];

    // ── Build Workbook ─────────────────────────────────────────────────────

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);

    // Lebar kolom otomatis berdasarkan konten terpanjang
    function autoColWidths(data: (string | number)[][]): XLSX.ColInfo[] {
      const maxCols = Math.max(...data.map((r) => r.length));
      return Array.from({ length: maxCols }, (_, ci) => {
        const maxLen = Math.max(
          ...data.map((r) => String(r[ci] ?? "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
      });
    }

    ws1["!cols"] = autoColWidths(sheet1Data);
    ws2["!cols"] = autoColWidths(sheet2Data);
    ws3["!cols"] = autoColWidths(sheet3Data);

    XLSX.utils.book_append_sheet(wb, ws1, "Rekap Kelas");
    XLSX.utils.book_append_sheet(wb, ws2, "Detail Rubrik");
    XLSX.utils.book_append_sheet(wb, ws3, "Rekomendasi");

    // Tulis ke buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Nama file: sanitize className (spasi → tanda hubung, hapus karakter khusus)
    const safeClass = className.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\-_]/g, "");
    const filename = `rapor-kelas-${safeClass}.xlsx`;

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
    console.error("[GET /api/export/excel]", error);
    return NextResponse.json(
      { success: false, error: "Gagal generate file Excel" },
      { status: 500 }
    );
  }
}
