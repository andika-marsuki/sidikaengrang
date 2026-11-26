// =============================================================================
// SI-DIKA — Auth.js Edge-Compatible Config
//
// File ini HANYA berisi konfigurasi yang aman untuk Edge Runtime (middleware).
// JANGAN impor prisma, bcryptjs, atau modul Node.js lainnya di sini.
//
// Pola ini disebut "split config" — direkomendasikan resmi Auth.js v5:
// https://authjs.dev/guides/edge-compatibility
//
// Gunakan file ini di:
//   - src/middleware.ts
//
// Gunakan src/lib/auth.ts (full config) di:
//   - Server Components
//   - API Route Handlers
//   - Server Actions
// =============================================================================

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],            // Provider diisi di auth.ts (butuh bcrypt + prisma)

  // trustHost: true → Auth.js membaca host dari request header (X-Forwarded-Host / Host)
  // sehingga tidak perlu mem-parse AUTH_URL sama sekali.
  // Ini menghindari bug "Invalid URL" ketika AUTH_URL mengandung kutip di .env.
  trustHost: true,

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  session: { strategy: "jwt" },

  callbacks: {
    // ── jwt: masukkan id & role saat token pertama dibuat ──────────────────
    // Data ini di-set oleh auth.ts saat `authorized` callback dari Credentials provider.
    // Di Edge, kita hanya membaca token yang sudah ada — tidak membuat yang baru.
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id as string;
        token.role = (user as any).role;
      }
      return token;
    },

    // ── session: propagate id & role ke session object ─────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as any;
      }
      return session;
    },

    // ── authorized: digunakan middleware untuk proteksi route ─────────────
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      // Route publik — selalu diizinkan
      const publicPaths = [
        "/login",
        "/register",
        "/try",
        "/api/auth",
        "/api/health",
        "/api/egrang-specs",
      ];
      if (pathname === "/" || publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;

      // Static assets — selalu diizinkan
      if (pathname.match(/\.(ico|png|jpg|svg|woff2?|css|js)$/)) return true;

      // Semua route lain memerlukan session
      return !!auth?.user;
    },
  },

  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
