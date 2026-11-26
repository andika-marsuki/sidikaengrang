"use client";
// =============================================================================
// SI-DIKA — GuestWizard
// Assessment wizard untuk pengguna publik (tanpa login).
// Semua kalkulasi berjalan di client — tidak ada data yang dikirim ke server.
// Saat user ingin simpan, tampilkan prompt untuk daftar/login.
// =============================================================================

import { useState, useCallback } from "react";
import Link from "next/link";
import Stopwatch from "@/components/field/Stopwatch";
import CounterButton from "@/components/field/CounterButton";
import RubrikForm, { type RubrikScores } from "@/components/field/RubrikForm";
import { calcFinalScore } from "@/lib/scoring-engine";
import { calcBMI, getBMICategory, recommendStepHeight } from "@/lib/bmi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpecOption {
  id: string; name: string; stepHeightCm: number; poleLengthCm: number; material: string;
}

interface GuestWizardProps {
  egrangSpecs: SpecOption[];
}

type WizardStep = 1 | 2 | 3 | 4;

type ScoringResult = {
  rubricComponent:  number;
  balanceComponent: number;
  speedComponent:   number;
  finalScore:       number;
  predicate:        string;
  recommendation:   string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ageYears(birthDateStr: string): number {
  const bd  = new Date(birthDateStr);
  const now = new Date();
  let age   = now.getFullYear() - bd.getFullYear();
  const m   = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
  return age;
}

const predicateEmoji: Record<string, string> = {
  "Prima":              "🏆",
  "Kompeten":           "🥈",
  "Berkembang":         "📈",
  "Perlu Pendampingan": "💪",
};

const predicateColor: Record<string, string> = {
  "Prima":              "text-yellow-300",
  "Kompeten":           "text-blue-300",
  "Berkembang":         "text-green-300",
  "Perlu Pendampingan": "text-orange-300",
};

// ─── Komponen ─────────────────────────────────────────────────────────────────

export default function GuestWizard({ egrangSpecs }: GuestWizardProps) {
  const [step, setStep]   = useState<WizardStep>(1);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // Step 1 — identitas & antropometri
  const [name,      setName]      = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender,    setGender]    = useState<"L" | "P">("L");
  const [specId,    setSpecId]    = useState(egrangSpecs[0]?.id ?? "");
  const [heightCm,  setHeightCm]  = useState("");
  const [weightKg,  setWeightKg]  = useState("");

  // Step 2 — lapangan
  const [duration,  setDuration]  = useState<number | null>(null);
  const [fallCount, setFallCount] = useState(0);
  const [trackDist, setTrackDist] = useState("10");

  // Step 3 — rubrik
  const [rubrikScores, setRubrikScores] = useState<RubrikScores | null>(null);

  // ── Step 1 submit ──────────────────────────────────────────────────────────
  const submitStep1 = () => {
    if (!name.trim())    { setError("Masukkan nama."); return; }
    if (!birthDate)      { setError("Masukkan tanggal lahir."); return; }
    if (!heightCm || !weightKg) { setError("Isi tinggi dan berat badan."); return; }
    if (parseFloat(heightCm) < 50 || parseFloat(heightCm) > 250) { setError("Tinggi tidak valid (50–250 cm)."); return; }
    if (parseFloat(weightKg) < 10 || parseFloat(weightKg) > 200) { setError("Berat tidak valid (10–200 kg)."); return; }
    if (!specId) { setError("Pilih spesifikasi egrang."); return; }
    setError(null);
    setStep(2);
  };

  // ── Step 2 submit ──────────────────────────────────────────────────────────
  const submitStep2 = () => {
    if (!duration)                   { setError("Hentikan stopwatch untuk mencatat waktu."); return; }
    if (parseFloat(trackDist) < 5)   { setError("Jarak lintasan minimal 5 m."); return; }
    setError(null);
    setStep(3);
  };

  // ── Step 3: rubrik selesai → langsung hitung ───────────────────────────────
  const handleRubrikComplete = useCallback((scores: RubrikScores) => {
    setRubrikScores(scores);
    setStep(4);
  }, []);

  // ── Step 4: hitung skor ────────────────────────────────────────────────────
  const handleCalculate = () => {
    if (!rubrikScores || !duration) return;

    const age = ageYears(birthDate);

    const scoring = calcFinalScore({
      scoreStatic:     rubrikScores.scoreStatic,
      scoreDynamic:    rubrikScores.scoreDynamic,
      scoreCoord:      rubrikScores.scoreCoord,
      scorePosture:    rubrikScores.scorePosture,
      fallCount,
      durationSeconds: duration,
      trackDistanceM:  parseFloat(trackDist),
      ageYears:        age,
      gender,
    });

    setResult(scoring);
  };

  // ── Render: Hasil ──────────────────────────────────────────────────────────
  if (result) {
    const height = parseFloat(heightCm);
    const weight = parseFloat(weightKg);
    const bmi    = calcBMI(height, weight);
    const bmiCat = getBMICategory(bmi);
    const rec    = recommendStepHeight(height);

    return (
      <div className="min-h-screen bg-gray-950 p-4 md:p-8">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Header hasil */}
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-3">
              {predicateEmoji[result.predicate] ?? "🏃"}
            </div>
            <h2 className="text-white text-2xl font-bold">Hasil Penilaian</h2>
            <p className="text-gray-400 text-sm mt-1">{name}</p>

            <div className="mt-6 bg-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Skor Akhir</p>
              <p className="text-yellow-300 text-6xl font-bold font-mono mt-1">{result.finalScore}</p>
              <p className={`text-xl font-semibold mt-2 ${predicateColor[result.predicate] ?? "text-white"}`}>
                {result.predicate}
              </p>
            </div>

            {/* Komponen skor */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-gray-500">Rubrik</p>
                <p className="text-white font-bold text-lg">{result.rubricComponent}</p>
                <p className="text-gray-500">/ 40</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-gray-500">Keseimbangan</p>
                <p className="text-white font-bold text-lg">{result.balanceComponent}</p>
                <p className="text-gray-500">/ 35</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-gray-500">Kecepatan</p>
                <p className="text-white font-bold text-lg">{result.speedComponent}</p>
                <p className="text-gray-500">/ 25</p>
              </div>
            </div>
          </div>

          {/* BMI & rekomendasi egrang */}
          <div className="bg-gray-900 rounded-2xl p-5 space-y-2 text-sm">
            <h3 className="text-gray-300 font-semibold">📊 Data Fisik</h3>
            <p className="text-gray-400">
              BMI: <span className="text-white font-semibold">{bmi}</span>{" "}
              <span className="text-gray-500">({bmiCat})</span>
            </p>
            <p className="text-gray-400">
              Rekomendasi tinggi pijakan:{" "}
              <span className="text-green-300 font-semibold">{rec.label}</span>
            </p>
          </div>

          {/* Rekomendasi latihan */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <h3 className="text-gray-300 font-semibold text-sm mb-2">💡 Rekomendasi Latihan</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{result.recommendation}</p>
          </div>

          {/* CTA simpan */}
          {!showSavePrompt ? (
            <div className="bg-gradient-to-r from-yellow-900/40 to-green-900/40 border border-yellow-700/50 rounded-2xl p-5 text-center">
              <p className="text-yellow-200 font-semibold text-sm">💾 Simpan hasil ini?</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">
                Daftarkan akun gratis untuk menyimpan riwayat penilaian, cetak laporan, dan bandingkan perkembangan.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-sm rounded-xl transition-colors"
                >
                  Daftar Gratis
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold text-sm rounded-xl transition-colors"
                >
                  Sudah punya akun
                </Link>
              </div>
            </div>
          ) : null}

          {/* Tombol coba lagi */}
          <button
            onClick={() => {
              setResult(null);
              setStep(1);
              setDuration(null);
              setFallCount(0);
              setStepCount(0);
              setRubrikScores(null);
              setError(null);
              setShowSavePrompt(false);
            }}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-colors"
          >
            ↺ Penilaian Baru
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Wizard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">🏃 Coba Penilaian Egrang</h1>
            <p className="text-gray-400 text-sm mt-1">
              Tanpa akun • Hasil tampil langsung • Gratis
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            Punya akun?{" "}
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300">
              Masuk →
            </Link>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex gap-2 mb-6">
          {["1 Identitas", "2 Lapangan", "3 Rubrik", "4 Hitung"].map((label, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i < step - 1 ? "bg-green-500" :
                i === step - 1 ? "bg-yellow-400" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ─── STEP 1: Identitas & Antropometri ─────────────────────────────── */}
        {step === 1 && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
            <h2 className="text-white text-lg font-bold">Langkah 1: Identitas & Antropometri</h2>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama siswa"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Tanggal Lahir *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Jenis Kelamin *</label>
                <div className="flex gap-2 mt-1">
                  {(["L", "P"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                        gender === g
                          ? "bg-yellow-400 text-gray-900"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {g === "L" ? "Laki-laki" : "Perempuan"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Spesifikasi Egrang *</label>
              <select
                value={specId}
                onChange={(e) => setSpecId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm"
              >
                {egrangSpecs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — pijakan {s.stepHeightCm}cm ({s.material})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Tinggi Badan (cm) *</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="mis. 155"
                  min={50} max={250}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Berat Badan (kg) *</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="mis. 48"
                  min={10} max={200}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <button
              onClick={submitStep1}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl text-lg transition-colors"
            >
              Lanjut ke Lapangan →
            </button>
          </div>
        )}

        {/* ─── STEP 2: Data Lapangan ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-white text-lg font-bold">Langkah 2: Data Lapangan</h2>

            <div className="bg-gray-900 rounded-2xl p-4">
              <label className="block text-gray-400 text-sm mb-2">Jarak Lintasan (m)</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTrackDist(String(d))}
                    className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                      trackDist === String(d)
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <Stopwatch onStop={(s) => setDuration(s)} />

            <div className="bg-gray-900 rounded-2xl p-4">
              <div className="flex justify-around">
                <CounterButton label="Jatuh"   icon="⬇️" color="red"  onChange={setFallCount} />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl"
              >
                ← Kembali
              </button>
              <button
                onClick={submitStep2}
                className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl transition-colors"
              >
                Lanjut ke Rubrik →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Rubrik ───────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-white text-lg font-bold">Langkah 3: Penilaian Rubrik</h2>
            <RubrikForm sessionKey="rubrik_guest" onComplete={handleRubrikComplete} />
            <button
              onClick={() => setStep(2)}
              className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl"
            >
              ← Kembali
            </button>
          </div>
        )}

        {/* ─── STEP 4: Konfirmasi & Hitung ─────────────────────────────────── */}
        {step === 4 && rubrikScores && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-white text-lg font-bold">Langkah 4: Konfirmasi & Hitung Skor</h2>

            <div className="bg-gray-800 rounded-xl p-4 text-sm space-y-1.5">
              <p className="text-gray-300"><span className="text-gray-500">Nama:</span> {name}</p>
              <p className="text-gray-300">
                <span className="text-gray-500">Lahir:</span> {birthDate} •{" "}
                Usia ~{ageYears(birthDate)} tahun • {gender === "L" ? "Laki-laki" : "Perempuan"}
              </p>
              <p className="text-gray-300"><span className="text-gray-500">TB/BB:</span> {heightCm} cm / {weightKg} kg</p>
              <p className="text-gray-300">
                <span className="text-gray-500">Waktu:</span> {duration}s •{" "}
                Jarak: {trackDist}m • Jatuh: {fallCount}x
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">Rubrik:</span>{" "}
                Statis {rubrikScores.scoreStatic} · Dinamis {rubrikScores.scoreDynamic} ·{" "}
                Koordinasi {rubrikScores.scoreCoord} · Postur {rubrikScores.scorePosture}
              </p>
            </div>

            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl px-4 py-3 text-blue-300 text-xs">
              ℹ️ Mode coba-dulu: skor hanya ditampilkan di layar, tidak disimpan ke database.
              Daftar akun untuk menyimpan riwayat.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl"
              >
                ← Kembali
              </button>
              <button
                onClick={handleCalculate}
                className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors"
              >
                🧮 Hitung Skor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
