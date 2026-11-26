"use client";
// =============================================================================
// SI-DIKA — Halaman Registrasi
// Siapa pun bisa mendaftar dan langsung bisa menyimpan penilaian.
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Pendaftaran gagal. Coba lagi.");
        return;
      }

      setSuccess(true);
      // Arahkan ke login setelah 2 detik
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Koneksi gagal. Periksa internet dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-green-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900">Akun berhasil dibuat!</h2>
          <p className="text-gray-500 text-sm mt-2">Mengarahkan ke halaman login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-green-50 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 shadow-lg mb-4">
            <span className="text-3xl" role="img" aria-label="egrang">🏃</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Akun</h1>
          <p className="text-sm text-gray-500 mt-1">
            Daftar untuk menyimpan hasil penilaian egrang
          </p>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                id="name" name="name" type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="mis. Ahmad Fauzi, S.Pd"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email" name="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@sekolah.id"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password" name="password" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter, huruf besar & angka"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                           placeholder:text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-400">Minimal 8 karakter, mengandung huruf besar dan angka</p>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password
              </label>
              <input
                id="confirm" name="confirm" type="password" required
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600
                         disabled:opacity-60 text-gray-900 font-semibold text-sm rounded-lg
                         transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              {loading ? "Mendaftar…" : "Buat Akun"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-yellow-600 hover:text-yellow-700 font-medium">
            Masuk di sini
          </Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          Atau{" "}
          <Link href="/try" className="text-green-600 hover:text-green-700 font-medium">
            coba dulu tanpa akun →
          </Link>
        </p>
      </div>
    </div>
  );
}
