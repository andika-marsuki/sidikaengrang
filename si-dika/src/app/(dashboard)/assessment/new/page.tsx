// =============================================================================
// SI-DIKA — Halaman Assessment Baru
// TASK-5.8 — Server Component pembungkus; muat data siswa & spec untuk wizard
// =============================================================================

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import AssessmentWizard from "./AssessmentWizard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Penilaian Baru" };

interface PageProps {
  searchParams: Promise<{ studentId?: string }>;
}

export default async function NewAssessmentPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN", "TEACHER"]);

  const { studentId } = await searchParams;

  const [students, egrangSpecs] = await Promise.all([
    prisma.student.findMany({
      where: { isActive: true },
      orderBy: [{ className: "asc" }, { name: "asc" }],
      select: { id: true, name: true, nisn: true, className: true, birthDate: true, gender: true },
    }),
    prisma.egrangSpec.findMany({
      orderBy: { stepHeightCm: "asc" },
      select: { id: true, name: true, stepHeightCm: true, poleLengthCm: true, material: true },
    }),
  ]);

  return (
    <AssessmentWizard
      students={students}
      egrangSpecs={egrangSpecs}
      preselectedStudentId={studentId}
    />
  );
}
