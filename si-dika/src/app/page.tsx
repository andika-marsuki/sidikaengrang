// =============================================================================
// SI-DIKA — Landing Page (Public)
// Dapat dikunjungi siapa saja tanpa login.
// User yang sudah login diarahkan langsung ke /dashboard.
// =============================================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

// Memanggil auth() saat request — tidak boleh di-prerender saat build
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SI-DIKA — Sistem Informasi Digital Kebugaran Aktif",
  description:
    "Penilaian engrang berbasis digital untuk guru PJOK. Coba gratis, daftar untuk menyimpan rekam perkembangan siswa.",
};

export default async function LandingPage() {
  // Jika sudah login, langsung ke dashboard
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Navbar ── */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏃</span>
          <span className="font-bold text-lg">SI-DIKA</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
          >
            Daftar Gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
          ✨ Gratis untuk semua guru PJOK
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          Penilaian Engrang{" "}
          <span className="text-yellow-400">Digital</span>{" "}
          untuk Guru PJOK
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Rekam, hitung, dan pantau perkembangan motorik siswa secara digital.
          Gunakan stopwatch, rubrik interaktif, dan laporan otomatis — langsung dari ponsel di lapangan.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/try"
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg rounded-xl transition-colors"
          >
            🏃 Coba Sekarang — Tanpa Daftar
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg rounded-xl transition-colors"
          >
            Daftar & Simpan Hasil
          </Link>
        </div>
      </section>

      {/* ── Fitur ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-center text-gray-400 text-sm font-semibold uppercase tracking-widest mb-8">
          Apa saja yang bisa dilakukan?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: "⏱️",
              title: "Stopwatch Lapangan",
              desc: "Catat waktu tempuh langsung di halaman penilaian. Berfungsi offline.",
            },
            {
              icon: "📋",
              title: "Rubrik 4 Dimensi",
              desc: "Penilaian keseimbangan statis, dinamis, koordinasi, dan postur dengan panduan kriteria.",
            },
            {
              icon: "🧮",
              title: "Skor Otomatis",
              desc: "Skor akhir dihitung berdasarkan rubrik, penalti jatuh, dan norma kecepatan usia.",
            },
            {
              icon: "📊",
              title: "Pre-Test & Post-Test",
              desc: "Bandingkan perkembangan siswa sebelum dan sesudah program latihan.",
            },
            {
              icon: "🏅",
              title: "Badge Pencapaian",
              desc: "Siswa mendapat badge otomatis saat mencapai target — Zero Fall, Iron Balance, Most Improved.",
            },
            {
              icon: "📄",
              title: "Ekspor Laporan",
              desc: "Unduh laporan kelas dalam format PDF dan Excel dengan satu klik.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA bawah ── */}
      <section className="border-t border-gray-800 py-16 text-center px-6">
        <h2 className="text-2xl font-bold mb-3">Siap mencoba?</h2>
        <p className="text-gray-400 text-sm mb-6">
          Tidak perlu kartu kredit. Daftar gratis, mulai menilai dalam 2 menit.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/try"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
          >
            Coba Dulu Tanpa Akun
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl transition-colors"
          >
            Daftar Gratis
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600 px-6">
        SI-DIKA — Sistem Informasi Digital Kebugaran Aktif &nbsp;·&nbsp;
        <Link href="/login" className="hover:text-gray-400">Masuk</Link>
        &nbsp;·&nbsp;
        <Link href="/register" className="hover:text-gray-400">Daftar</Link>
      </footer>
    </div>
  );
}
