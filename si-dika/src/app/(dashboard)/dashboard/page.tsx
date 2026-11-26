// =============================================================================
// SI-DIKA — Dashboard Utama
// TASK-6.1 (sederhana untuk verifikasi Fase 2 & 3)
// =============================================================================

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);

  // Statistik sederhana
  const totalStudents = await prisma.student.count({ where: { isActive: true } });
  const totalAssessments = await prisma.assessment.count();
  const recentAssessments = await prisma.assessment.findMany({
    take: 5,
    orderBy: { assessedAt: "desc" },
    include: {
      student: { select: { name: true, className: true } },
      teacher: { select: { name: true } },
    },
  });

  // Daftar kelas unik dengan jumlah assessment
  const classGroups = await prisma.student.groupBy({
    by: ["className"],
    where: { isActive: true },
    _count: { id: true },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selamat datang, <span className="font-medium text-gray-700">{user.name}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Siswa</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
              👨‍🎓
            </div>
          </div>
          <Link href="/students" className="mt-4 inline-block text-sm text-yellow-600 hover:text-yellow-700 font-medium">
            Lihat Daftar →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Assessment</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalAssessments}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
              📊
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-green-50 rounded-xl border border-yellow-200 shadow-sm p-6">
          <p className="text-sm text-gray-700 font-semibold mb-3">Quick Actions</p>
          <div className="space-y-2">
            {user.role !== "STUDENT" && (
              <>
                <Link
                  href="/assessment/new"
                  className="block px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg text-center transition-colors"
                >
                  🏃 Buat Assessment Baru
                </Link>
                <Link
                  href="/students/import"
                  className="block px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg text-center border border-gray-300 transition-colors"
                >
                  📂 Import Siswa
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Daftar Kelas — Link ke Laporan */}
      {classGroups.length > 0 && user.role !== "STUDENT" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Laporan per Kelas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {classGroups
              .sort((a, b) => a.className.localeCompare(b.className))
              .map((cg) => (
                <Link
                  key={cg.className}
                  href={`/report/${encodeURIComponent(cg.className)}`}
                  className="flex flex-col items-center p-4 bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300 rounded-lg transition-colors"
                >
                  <span className="text-lg font-bold text-gray-800">{cg.className}</span>
                  <span className="text-xs text-gray-500 mt-1">{cg._count.id} siswa</span>
                  <span className="text-xs text-yellow-600 font-medium mt-2">Lihat Laporan →</span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Recent Assessments */}
      {recentAssessments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Terbaru</h2>
          <div className="space-y-3">
            {recentAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{assessment.student.name}</p>
                  <p className="text-sm text-gray-600">
                    {assessment.student.className} • {assessment.testType} • oleh {assessment.teacher.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(assessment.assessedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">{assessment.finalScore}</p>
                  <p className="text-xs text-gray-600">{assessment.predicate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
