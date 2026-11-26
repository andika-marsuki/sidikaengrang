// =============================================================================
// SI-DIKA — Halaman Login
// TASK-2.2
// Mendukung login via Email (Admin/Guru) atau NISN 10-digit (Siswa).
// =============================================================================

import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — SI-DIKA",
};

interface PageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  // Jika sudah login, langsung ke dashboard
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;
  const errorCode = params.error;

  const errorMessages: Record<string, string> = {
    CredentialsSignin:    "Email/NISN atau password salah.",
    Configuration:        "Terjadi kesalahan konfigurasi. Hubungi administrator.",
    Default:              "Terjadi kesalahan. Silakan coba lagi.",
  };
  const errorMsg = errorCode
    ? (errorMessages[errorCode] ?? errorMessages.Default)
    : null;

  // Server Action untuk submit login
  async function loginAction(formData: FormData) {
    "use server";
    const identifier = (formData.get("identifier") as string)?.trim();
    const password   = formData.get("password") as string;

    try {
      await signIn("credentials", {
        identifier,
        password,
        redirectTo: "/dashboard",
      });
    } catch (error) {
      // signIn melempar NEXT_REDIRECT saat berhasil — biarkan propagate
      if (error instanceof AuthError) {
        redirect(`/login?error=${error.type}`);
      }
      throw error;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-green-50 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 shadow-lg mb-4">
            <span className="text-3xl" role="img" aria-label="egrang">🏃</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SI-DIKA</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistem Informasi Digital Kebugaran Aktif
          </p>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form action={loginAction} className="space-y-4">

            {/* Identifier */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email atau NISN Siswa
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                placeholder="email@sekolah.id atau 10 digit NISN"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                           placeholder:text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-400">
                Siswa: masukkan NISN 10 digit langsung
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600
                         text-gray-900 font-semibold text-sm rounded-lg transition-colors
                         focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              Masuk
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm text-gray-500">
            Belum punya akun?{" "}
            <Link href="/register" className="text-yellow-600 hover:text-yellow-700 font-medium">
              Daftar sekarang
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            Atau{" "}
            <Link href="/try" className="text-green-600 hover:text-green-700 font-medium">
              coba tanpa akun →
            </Link>
          </p>
          <p className="text-xs text-gray-400 pt-1">
            Lupa password? Hubungi Administrator Sekolah.
          </p>
        </div>
      </div>
    </div>
  );
}
