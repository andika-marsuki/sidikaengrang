// =============================================================================
// SI-DIKA — Halaman Manajemen Spesifikasi Egrang
// TASK-3.5 (REQ-1.3) — Server Component
// =============================================================================

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Spesifikasi Egrang" };

export default async function EgrangSpecsPage() {
  await requireRole(["ADMIN", "TEACHER"]);

  const specs = await prisma.egrangSpec.findMany({
    orderBy: { stepHeightCm: "asc" },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spesifikasi Egrang</h1>
          <p className="text-sm text-gray-500 mt-1">
            Standar alat yang digunakan dalam assessment
          </p>
        </div>
        <Link
          href="/egrang-specs/new"
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors"
        >
          ➕ Tambah Spesifikasi
        </Link>
      </div>

      {/* Grid */}
      {specs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p className="text-lg">Belum ada spesifikasi egrang.</p>
          <p className="text-sm mt-2">Klik tombol di atas untuk menambahkan.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specs.map((spec) => (
            <div
              key={spec.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-yellow-300 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-gray-900 mb-4 leading-snug">
                {spec.name}
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tinggi Pijakan</dt>
                  <dd className="font-semibold text-gray-900">{spec.stepHeightCm} cm</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Panjang Tongkat</dt>
                  <dd className="font-semibold text-gray-900">{spec.poleLengthCm} cm</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Material</dt>
                  <dd className="font-medium text-gray-700">{spec.material}</dd>
                </div>
              </dl>
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                Dibuat {new Date(spec.createdAt).toLocaleDateString("id-ID")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
