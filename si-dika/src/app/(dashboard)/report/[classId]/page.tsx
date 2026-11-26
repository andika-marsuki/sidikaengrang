// =============================================================================
// SI-DIKA — Halaman Laporan Kelas
// TASK-7.3
// /report/[classId] — tampilkan ringkasan penilaian per kelas + tombol ekspor
// =============================================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ExportButtons from "./ExportButtons";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { classId } = await params;
  const className = decodeURIComponent(classId);

  // Ambil semua assessment untuk kelas ini
  const assessments = await prisma.assessment.findMany({
    where: {
      student: { className, isActive: true },
    },
    include: {
      student: {
        select: {
          id: true,
          nisn: true,
          name: true,
          className: true,
          academicYear: true,
          gender: true,
        },
      },
    },
    orderBy: [
      { student: { name: "asc" } },
      { testType: "asc" },
      { assessedAt: "desc" },
    ],
  });

  if (assessments.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Link
          href="/dashboard"
          className="inline-block mb-4 text-sm text-gray-600 hover:text-yellow-600"
        >
          ← Kembali ke Dashboard
        </Link>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h1 className="text-xl font-bold text-yellow-900 mb-2">
            Tidak Ada Data Penilaian
          </h1>
          <p className="text-sm text-yellow-700">
            Belum ada data penilaian untuk kelas <strong>{className}</strong>.
            Silakan buat penilaian terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  // Dapatkan akademik year dari assessment pertama
  const academicYear = assessments[0].student.academicYear;

  // Group assessments by student
  const studentGroups = assessments.reduce<
    Record<string, typeof assessments>
  >((acc, a) => {
    if (!acc[a.studentId]) acc[a.studentId] = [];
    acc[a.studentId].push(a);
    return acc;
  }, {});

  const studentSummaries = Object.values(studentGroups).map((group) => {
    const student = group[0].student;
    const preTest = group.find((a) => a.testType === "PRE_TEST");
    const postTest = group.find((a) => a.testType === "POST_TEST");
    const latestAssessment = group[0]; // karena sudah diurutkan desc

    return {
      studentId: student.id,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender === "L" ? "L" : "P",
      preTestScore: preTest?.finalScore ?? null,
      preTestPredicate: preTest?.predicate ?? null,
      postTestScore: postTest?.finalScore ?? null,
      postTestPredicate: postTest?.predicate ?? null,
      latestScore: latestAssessment.finalScore,
      latestPredicate: latestAssessment.predicate,
      latestTestType: latestAssessment.testType,
      assessmentCount: group.length,
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-block mb-2 text-sm text-gray-600 hover:text-yellow-600"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Laporan Kelas {className}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Tahun Ajaran {academicYear} • {studentSummaries.length} Siswa •{" "}
            {assessments.length} Total Penilaian
          </p>
        </div>

        {/* Export Buttons — Client Component */}
        <ExportButtons className={className} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Siswa</p>
          <p className="text-2xl font-bold text-gray-900">
            {studentSummaries.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Pre-Test</p>
          <p className="text-2xl font-bold text-blue-600">
            {studentSummaries.filter((s) => s.preTestScore !== null).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Post-Test</p>
          <p className="text-2xl font-bold text-green-600">
            {studentSummaries.filter((s) => s.postTestScore !== null).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">
            Rata-rata Skor
          </p>
          <p className="text-2xl font-bold text-yellow-600">
            {(
              studentSummaries.reduce((sum, s) => sum + s.latestScore, 0) /
              studentSummaries.length
            ).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  NISN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  JK
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Pre-Test
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Post-Test
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Predikat Terakhir
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Jumlah Tes
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentSummaries.map((s, i) => (
                <tr key={s.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{i + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {s.nisn}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    {s.gender}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {s.preTestScore !== null ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.preTestPredicate === "Prima"
                            ? "bg-green-100 text-green-800"
                            : s.preTestPredicate === "Kompeten"
                              ? "bg-blue-100 text-blue-800"
                              : s.preTestPredicate === "Berkembang"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.preTestScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {s.postTestScore !== null ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.postTestPredicate === "Prima"
                            ? "bg-green-100 text-green-800"
                            : s.postTestPredicate === "Kompeten"
                              ? "bg-blue-100 text-blue-800"
                              : s.postTestPredicate === "Berkembang"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.postTestScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.latestPredicate === "Prima"
                          ? "bg-green-100 text-green-800"
                          : s.latestPredicate === "Kompeten"
                            ? "bg-blue-100 text-blue-800"
                            : s.latestPredicate === "Berkembang"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {s.latestPredicate}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    {s.assessmentCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <Link
                      href={`/students/${s.studentId}`}
                      className="text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        💡 Gunakan tombol <strong>Ekspor Excel</strong> atau{" "}
        <strong>Ekspor PDF</strong> di atas untuk menyimpan rapor kelas.
      </p>
    </div>
  );
}
