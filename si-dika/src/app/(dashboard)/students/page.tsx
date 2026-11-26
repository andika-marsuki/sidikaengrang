// =============================================================================
// SI-DIKA — Halaman Daftar Siswa
// TASK-3.3 — Server Component
// =============================================================================

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftar Siswa" };

interface PageProps {
  searchParams: Promise<{
    className?: string;
    academicYear?: string;
    page?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN", "TEACHER"]);

  const params       = await searchParams;
  const className    = params.className;
  const academicYear = params.academicYear;
  const page         = Math.max(1, parseInt(params.page ?? "1"));
  const limit        = 20;
  const skip         = (page - 1) * limit;

  const where: Record<string, unknown> = { isActive: true };
  if (className)    where.className    = className;
  if (academicYear) where.academicYear = academicYear;

  const [students, total, classes] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ className: "asc" }, { name: "asc" }],
      select: {
        id: true, nisn: true, name: true,
        className: true, academicYear: true, gender: true,
      },
    }),
    prisma.student.count({ where }),
    prisma.student.findMany({
      where: { isActive: true },
      select: { className: true },
      distinct: ["className"],
      orderBy: { className: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Siswa</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} siswa aktif
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/students/import"
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📂 Import CSV/Excel
          </Link>
          <Link
            href="/students/new"
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            ➕ Tambah Manual
          </Link>
        </div>
      </div>

      {/* Filter — menggunakan form GET agar tetap RSC */}
      <form method="GET" className="mb-4 flex flex-wrap gap-3 items-center">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          Kelas:
          <select
            name="className"
            defaultValue={className ?? ""}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">Semua</option>
            {classes.map((c) => (
              <option key={c.className} value={c.className}>
                {c.className}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
        >
          Filter
        </button>
        {className && (
          <Link
            href="/students"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">NISN</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kelas</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tahun Ajaran</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Gender</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Tidak ada siswa ditemukan.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.nisn}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-700">{s.className}</td>
                  <td className="px-4 py-3 text-gray-700">{s.academicYear}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        s.gender === "L"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-pink-100 text-pink-800"
                      }`}
                    >
                      {s.gender === "L" ? "L" : "P"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/students/${s.id}`}
                      className="text-yellow-600 hover:text-yellow-700 font-medium text-xs"
                    >
                      Profil →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/students?page=${p}${className ? `&className=${encodeURIComponent(className)}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
