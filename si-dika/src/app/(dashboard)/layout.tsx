// =============================================================================
// SI-DIKA — Dashboard Layout
// Wrapper untuk semua halaman dashboard dengan navbar
// =============================================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import OfflineBanner from "@/components/shared/OfflineBanner";
import SyncStatusBadge from "@/components/shared/SyncStatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="egrang">🏃</span>
              <span className="text-xl font-bold text-gray-900">SI-DIKA</span>
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-700 hover:text-yellow-600 font-medium">
                Dashboard
              </Link>
              <Link href="/students" className="text-gray-700 hover:text-yellow-600 font-medium">
                Siswa
              </Link>
              {(user.role === "ADMIN" || user.role === "TEACHER") && (
                <Link href="/egrang-specs" className="text-gray-700 hover:text-yellow-600 font-medium">
                  Spesifikasi Engrang
                </Link>
              )}
              {(user.role === "ADMIN" || user.role === "TEACHER") && (
                <Link href="/assessment/new" className="text-gray-700 hover:text-yellow-600 font-medium">
                  Penilaian
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusBadge />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* TODO Fase 6: OfflineBanner di sini */}
      <OfflineBanner />
      <main className="flex-1">{children}</main>
    </div>
  );
}
