// =============================================================================
// SI-DIKA — Halaman Profil Siswa
// TASK-3.4 (REQ-1.2)
// Menampilkan data siswa, BMI, rekomendasi tinggi pijakan, riwayat assessment, dan badge
// =============================================================================

import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessStudent } from "@/lib/auth";
import { calcBMI, getBMICategory, recommendStepHeight } from "@/lib/bmi";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import type { Metadata } from "next";
import PrePostChart from "@/components/dashboard/PrePostChart";
import BadgeDisplay from "@/components/shared/BadgeDisplay";
import type { BadgeCode } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: student ? `Profil ${student.name}` : "Profil Siswa",
  };
}

export default async function StudentProfilePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  // Periksa izin akses
  const hasAccess = await canAccessStudent(user.id, user.role, id);
  if (!hasAccess) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">Akses ditolak.</p>
          <p className="text-sm text-red-600 mt-2">Anda tidak memiliki izin untuk melihat profil siswa ini.</p>
          <Link href="/students" className="mt-4 inline-block text-sm text-red-600 underline">
            ← Kembali ke Daftar Siswa
          </Link>
        </div>
      </div>
    );
  }

  // Fetch student data
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      assessments: {
        orderBy: { assessedAt: "desc" },
        take: 10,
        include: {
          teacher: { select: { name: true } },
          egrangSpec: { select: { name: true, stepHeightCm: true } },
        },
      },
      badges: {
        orderBy: { awardedAt: "desc" },
      },
    },
  });

  if (!student) notFound();

  // ── Kalkulasi BMI dan rekomendasi (dari assessment terakhir jika ada) ──────
  const latestAssessment = student.assessments[0];
  let bmi: number | null = null;
  let bmiCategory: string | null = null;
  let stepRec: ReturnType<typeof recommendStepHeight> | null = null;

  if (latestAssessment) {
    bmi = calcBMI(latestAssessment.heightCm, latestAssessment.weightKg);
    bmiCategory = getBMICategory(bmi);
    stepRec = recommendStepHeight(latestAssessment.heightCm);
  }

  // ── Pre-test & Post-test terakhir untuk grafik perbandingan ─────────────────
  const preTest = student.assessments.find((a) => a.testType === "PRE_TEST");
  const postTest = student.assessments.find((a) => a.testType === "POST_TEST");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/students" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← Kembali ke Daftar Siswa
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            NISN {student.nisn} • {student.className} • {student.academicYear}
          </p>
        </div>
        {user.role !== "STUDENT" && (
          <Link
            href={`/assessment/new?studentId=${student.id}`}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
          >
            🏃 Buat Assessment Baru
          </Link>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar: Info Siswa + BMI */}
        <div className="md:col-span-1 space-y-4">
          {/* Kartu Info Dasar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Informasi Siswa</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Jenis Kelamin</dt>
                <dd className="font-medium text-gray-900">
                  {student.gender === "L" ? "Laki-laki" : "Perempuan"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Tanggal Lahir</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(student.birthDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Usia</dt>
                <dd className="font-medium text-gray-900">
                  {Math.floor(
                    (new Date().getTime() - new Date(student.birthDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 365.25)
                  )}{" "}
                  tahun
                </dd>
              </div>
            </dl>
          </div>

          {/* Kartu BMI & Rekomendasi Pijakan */}
          {bmi && stepRec && (
            <div className="bg-gradient-to-br from-yellow-50 to-green-50 rounded-xl border border-yellow-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Antropometri Terakhir</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Tinggi Badan</dt>
                  <dd className="font-semibold text-gray-900 text-lg">
                    {latestAssessment?.heightCm} cm
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">Berat Badan</dt>
                  <dd className="font-semibold text-gray-900 text-lg">
                    {latestAssessment?.weightKg} kg
                  </dd>
                </div>
                <div className="pt-2 border-t border-yellow-200">
                  <dt className="text-gray-600">BMI</dt>
                  <dd className="font-bold text-yellow-700 text-xl">{bmi}</dd>
                  <dd className="text-xs text-gray-600 mt-0.5">({bmiCategory})</dd>
                </div>
                <div className="pt-2 border-t border-yellow-200">
                  <dt className="text-gray-600 mb-1">Rekomendasi Tinggi Pijakan</dt>
                  <dd className="font-semibold text-green-700 text-sm">
                    {stepRec.minCm}–{stepRec.maxCm} cm
                  </dd>
                  <dd className="text-xs text-gray-600 mt-0.5">{stepRec.label}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Badge */}
          {student.badges.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Lencana / Badges</h2>
              <BadgeDisplay
                badges={student.badges.map((b) => ({
                  code:      b.badgeCode as BadgeCode,
                  earned:    true,
                  awardedAt: b.awardedAt.toISOString(),
                }))}
              />
            </div>
          )}
          {student.badges.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Lencana / Badges</h2>
              <BadgeDisplay badges={[]} />
            </div>
          )}
        </div>

        {/* Main Content: Riwayat Assessment */}
        <div className="md:col-span-2 space-y-4">
          {/* Perbandingan Pre-Test vs Post-Test dengan grafik */}
          {preTest && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Perbandingan Pre-Test vs Post-Test
              </h2>
              <PrePostChart
                preTest={preTest ? {
                  scoreStatic:  preTest.scoreStatic,
                  scoreDynamic: preTest.scoreDynamic,
                  scoreCoord:   preTest.scoreCoord,
                  scorePosture: preTest.scorePosture,
                  finalScore:   preTest.finalScore,
                  predicate:    preTest.predicate,
                  testType:     preTest.testType,
                } : null}
                postTest={postTest ? {
                  scoreStatic:  postTest.scoreStatic,
                  scoreDynamic: postTest.scoreDynamic,
                  scoreCoord:   postTest.scoreCoord,
                  scorePosture: postTest.scorePosture,
                  finalScore:   postTest.finalScore,
                  predicate:    postTest.predicate,
                  testType:     postTest.testType,
                } : null}
              />
            </div>
          )}

          {/* Riwayat Assessment */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Assessment</h2>
            {student.assessments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada assessment</p>
            ) : (
              <div className="space-y-3">
                {student.assessments.map((assessment) => (
                  <Link
                    key={assessment.id}
                    href={`/assessments/${assessment.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              assessment.testType === "PRE_TEST"
                                ? "bg-blue-100 text-blue-700"
                                : assessment.testType === "POST_TEST"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {assessment.testType === "PRE_TEST"
                              ? "Pre-Test"
                              : assessment.testType === "POST_TEST"
                                ? "Post-Test"
                                : "Latihan"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(assessment.assessedAt).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          Dinilai oleh: <span className="font-medium">{assessment.teacher.name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Egrang: {assessment.egrangSpec.name} • Waktu: {assessment.durationSeconds}s • Jatuh:{" "}
                          {assessment.fallCount}x
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-600">{assessment.finalScore}</p>
                        <p className="text-xs text-gray-600">{assessment.predicate}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
