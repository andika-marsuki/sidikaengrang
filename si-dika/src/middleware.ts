// =============================================================================
// SI-DIKA — Next.js Middleware (Edge Runtime)
// TASK-2.3
//
// PENTING: Middleware berjalan di Edge Runtime (bukan Node.js).
// Jangan impor prisma, bcryptjs, atau modul Node.js lainnya di sini.
//
// Proteksi route dilakukan via authConfig.callbacks.authorized (auth.config.ts).
// Fine-grained RBAC (admin-only, teacher-only) ditangani di masing-masing
// API Route Handler menggunakan requireRole() dari auth.ts.
// =============================================================================

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Buat middleware Auth.js dari edge-compatible config (tanpa Prisma)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Route publik — selalu diizinkan ──────────────────────────────────────
  const publicPaths = [
    "/login",
    "/register",
    "/try",
    "/api/auth",
    "/api/health",
    "/api/egrang-specs",   // publik: dibutuhkan halaman /try
  ];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Root "/" juga publik (landing page)
  if (pathname === "/") return NextResponse.next();

  // ── Tidak ada session → redirect ke /login ────────────────────────────────
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin-only routes: kembalikan 403 untuk non-admin ─────────────────────
  // Fine-grained RBAC ditangani di Route Handler menggunakan requireRole().
  // Middleware hanya menangani kasus sederhana agar tetap ringan di Edge.
  if (pathname.startsWith("/api/admin")) {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin yang diizinkan." },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  /*
   * Match semua path KECUALI:
   *   - _next/static  (static assets)
   *   - _next/image   (image optimization)
   *   - favicon.ico
   *   - File-file publik (icons, manifest.json, sw.js, workbox-*.js)
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js|workbox-.*\\.js).*)",
  ],
};
