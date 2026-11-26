// =============================================================================
// SI-DIKA — Auth.js v5 Full Configuration (Node.js Runtime Only)
// TASK-2.1, TASK-2.4
//
// File ini menggunakan Prisma + bcrypt — JANGAN diimpor di middleware.
// Gunakan auth.config.ts untuk middleware (Edge Runtime).
//
// Login yang didukung:
//   ADMIN/TEACHER : email + password
//   STUDENT       : NISN 10-digit langsung (sistem mengonversi ke email internal)
//                   Contoh: "1234567890" → "1234567890@siswa.si-dika.sch.id"
// =============================================================================

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@/types";

// ─── Extend next-auth session types ──────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id:   string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
  }
}

// Note: next-auth/jwt augmentation dihapus — Auth.js v5 beta
// menyimpan custom fields (id, role) langsung di JWT via callbacks,
// bukan via modul augmentasi terpisah.

// ─── Auth.js full config (Node.js runtime) ───────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,          // ← spread edge-compatible config (callbacks, pages, session, secret)

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        // "identifier" menerima email ATAU NISN 10-digit
        identifier: { label: "Email / NISN Siswa", type: "text" },
        password:   { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier as string | undefined;
        const password   = credentials?.password   as string | undefined;

        if (!identifier || !password) return null;

        // ── Resolusi identifier ke email ──────────────────────────────────
        // Jika 10-digit angka → ini adalah NISN siswa
        const isNisn = /^\d{10}$/.test(identifier.trim());
        const email  = isNisn
          ? `${identifier.trim()}@siswa.si-dika.sch.id`
          : identifier.trim().toLowerCase();

        // ── Ambil user dari database ──────────────────────────────────────
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id:       true,
            email:    true,
            name:     true,
            password: true,
            role:     true,
          },
        });

        if (!user) return null;

        // ── Verifikasi password (bcrypt) ──────────────────────────────────
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          role:  user.role as Role,
        };
      },
    }),
  ],
});

// ─── RBAC Helpers (TASK-2.4) ──────────────────────────────────────────────────

/**
 * Mendapatkan user yang sedang login dari session.
 * Gunakan di Server Components dan Route Handlers.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Memastikan user yang sedang login memiliki role yang diizinkan.
 * Melempar AuthError jika tidak memiliki akses.
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("UNAUTHENTICATED");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("FORBIDDEN");
  }
  return user;
}

/**
 * Memeriksa apakah user boleh mengakses data siswa tertentu.
 *   - Admin  → selalu boleh
 *   - Teacher → boleh jika pernah membuat assessment untuk siswa tersebut
 *   - Student → hanya boleh akses profil sendiri (lookup via email/NISN)
 */
export async function canAccessStudent(
  requestingUserId:   string,
  requestingUserRole: Role,
  targetStudentId:    string
): Promise<boolean> {
  if (requestingUserRole === "ADMIN") return true;

  if (requestingUserRole === "TEACHER") {
    const count = await prisma.assessment.count({
      where: { teacherId: requestingUserId, studentId: targetStudentId },
    });
    return count > 0;
  }

  if (requestingUserRole === "STUDENT") {
    const user = await prisma.user.findUnique({
      where:  { id: requestingUserId },
      select: { email: true },
    });
    if (!user) return false;
    const nisn = user.email.replace("@siswa.si-dika.sch.id", "");
    const student = await prisma.student.findUnique({
      where:  { nisn },
      select: { id: true },
    });
    return student?.id === targetStudentId;
  }

  return false;
}

// ─── Custom Error class ───────────────────────────────────────────────────────

export class AuthError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN";
  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code === "UNAUTHENTICATED" ? "Login diperlukan" : "Akses ditolak");
    this.code = code;
    this.name = "AuthError";
  }
}
