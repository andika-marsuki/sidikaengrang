"use client";
// =============================================================================
// SI-DIKA — Assessment Wizard (Client Component)
// TASK-5.8 (REQ-2.1–2.3)
// 3 tahap: (1) Siswa + Antropometri, (2) Stopwatch + Counter, (3) Rubrik
// Simpan ke server saat online / Dexie saat offline.
// =============================================================================

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createId } from "@paralleldrive/cuid2";
import Stopwatch from "@/components/field/Stopwatch";
import CounterButton from "@/components/field/CounterButton";
import RubrikForm, { type RubrikScores } from "@/components/field/RubrikForm";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { calcFinalScore } from "@/lib/scoring-engine";
import { calcBMI } from "@/lib/bmi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentOption {
  id: string; name: string; nisn: string; className: string;
  birthDate: Date | string; gender: string;
}
interface SpecOption {
  id: string; name: string; stepHeightCm: number; poleLengthCm: number; material: string;
}

interface WizardProps {
  students:              StudentOption[];
  egrangSpecs:           SpecOption[];
  preselectedStudentId?: string;
}

type TestType = "PRE_TEST" | "POST_TEST" | "PRACTICE";
type WizardStep = 1 | 2 | 3 | 4; // 4 = konfirmasi

// ─── Helper ───────────────────────────────────────────────────────────────────

function ageYears(birthDate: Date | string): number {
  const bd = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const m = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
  return age;
}

// ─── Komponen ─────────────────────────────────────────────────────────────────

export default function AssessmentWizard({ students, egrangSpecs, preselectedStudentId }: WizardProps) {
  const router    = useRouter();
  const isOnline  = useOnlineStatus();

  // State antar-step
  const [step, setStep]           = useState<WizardStep>(1);
  const [saving, setSaving]       = useState(false);
  const [error,  setError]        = useState<string | null>(null);
  const [result, setResult]       = useState<{ finalScore: number; predicate: string; newBadges: string[] } | null>(null);

  // Step 1
  const [studentId,   setStudentId]   = useState(preselectedStudentId ?? "");
  const [specId,      setSpecId]      = useState(egrangSpecs[0]?.id ?? "");
  const [testType,    setTestType]    = useState<TestType>("PRE_TEST");
  const [heightCm,    setHeightCm]    = useState("");
  const [weightKg,    setWeightKg]    = useState("");

  // Step 2
  const [duration,    setDuration]    = useState<number | null>(null);
  const [fallCount,   setFallCount]   = useState(0);
  const [stepCount,   setStepCount]   = useState(0);
  const [trackDist,   setTrackDist]   = useState("10");

  // Step 3
  const [rubrikScores, setRubrikScores] = useState<RubrikScores | null>(null);

  // ── Step 1: submit ──────────────────────────────────────────────────────────
  const submitStep1 = () => {
    if (!studentId || !specId) { setError("Pilih siswa dan spesifikasi egrang."); return; }
    if (!heightCm || !weightKg) { setError("Isi tinggi dan berat badan."); return; }
    if (parseFloat(heightCm) < 50 || parseFloat(heightCm) > 250) { setError("Tinggi tidak valid (50–250 cm)."); return; }
    if (parseFloat(weightKg) < 10 || parseFloat(weightKg) > 200) { setError("Berat tidak valid (10–200 kg)."); return; }
    setError(null);
    setStep(2);
  };

  // ── Step 2: submit ──────────────────────────────────────────────────────────
  const submitStep2 = () => {
    if (!duration) { setError("Hentikan stopwatch untuk mencatat waktu."); return; }
    if (parseFloat(trackDist) < 5) { setError("Jarak lintasan minimal 5m."); return; }
    setError(null);
    setStep(3);
  };

  // ── Step 3: rubrik selesai ──────────────────────────────────────────────────
  const handleRubrikComplete = useCallback((scores: RubrikScores) => {
    setRubrikScores(scores);
    setStep(4);
  }, []);

  // ── Step 4: simpan ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!rubrikScores || !duration) return;
    setSaving(true);
    setError(null);

    const student = students.find((s) => s.id === studentId)!;
    const localId = createId();
    const height  = parseFloat(heightCm);
    const weight  = parseFloat(weightKg);
    const bmi     = calcBMI(height, weight);
    const dist    = parseFloat(trackDist);

    // Hitung scoring di client (sama hasilnya di server)
    const scoring = calcFinalScore({
      scoreStatic:    rubrikScores.scoreStatic,
      scoreDynamic:   rubrikScores.scoreDynamic,
      scoreCoord:     rubrikScores.scoreCoord,
      scorePosture:   rubrikScores.scorePosture,
      fallCount,
      durationSeconds: duration,
      trackDistanceM:  dist,
      ageYears:        ageYears(student.birthDate),
      gender:          student.gender as "L" | "P",
    });

    const payload = {
      localId,
      studentId,
      egrangSpecId:    specId,
      testType,
      heightCm:        height,
      weightKg:        weight,
      bmi,
      trackDistanceM:  dist,
      durationSeconds: duration,
      fallCount,
      stepCount:       stepCount || undefined,
      scoreStatic:     rubrikScores.scoreStatic,
      scoreDynamic:    rubrikScores.scoreDynamic,
      scoreCoord:      rubrikScores.scoreCoord,
      scorePosture:    rubrikScores.scorePosture,
      assessedAt:      new Date().toISOString(),
    };

    if (isOnline) {
      // ── Online: kirim ke server ───────────────────────────────────────────
      try {
        const res = await fetch("/api/assessments", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? "Gagal menyimpan");
        setResult({
          finalScore: scoring.finalScore,
          predicate:  scoring.predicate,
          newBadges:  (json.newBadges ?? []).map((b: any) => b.title),
        });
      } catch (err: any) {
        setError(err.message ?? "Koneksi gagal. Coba simpan offline.");
        setSaving(false);
        return;
      }
    } else {
      // ── Offline: simpan ke Dexie ──────────────────────────────────────────
      try {
        const { getOfflineDB } = await import("@/lib/offline/db");
        const db = getOfflineDB();
        await db.assessments.add({
          ...payload,
          studentName:    student.name,
          finalScore:     scoring.finalScore,
          predicate:      scoring.predicate,
          recommendation: scoring.recommendation,
          syncStatus:     "PENDING_SYNC",
          createdAt:      new Date().toISOString(),
        });
        setResult({
          finalScore: scoring.finalScore,
          predicate:  scoring.predicate,
          newBadges:  [],
        });
      } catch (err: any) {
        setError("Gagal menyimpan offline: " + err.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const selectedStudent = students.find((s) => s.id === studentId);

  // Konfirmasi / Hasil
  if (result) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {result.predicate === "Prima" ? "🏆" :
             result.predicate === "Kompeten" ? "🥈" :
             result.predicate === "Berkembang" ? "📈" : "💪"}
          </div>
          <h2 className="text-white text-2xl font-bold">Penilaian Tersimpan</h2>
          <p className="text-gray-400 text-sm mt-1">
            {isOnline ? "Tersimpan ke server" : "Tersimpan offline — akan disinkronkan saat online"}
          </p>
          <div className="mt-6 bg-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Skor Akhir</p>
            <p className="text-yellow-300 text-5xl font-bold font-mono mt-1">{result.finalScore}</p>
            <p className="text-gray-300 text-lg mt-2">{result.predicate}</p>
          </div>
          {result.newBadges.length > 0 && (
            <div className="mt-4 bg-yellow-900/40 border border-yellow-700 rounded-xl p-4">
              <p className="text-yellow-300 text-sm font-semibold">🏅 Badge Baru Diraih!</p>
              {result.newBadges.map((b) => (
                <p key={b} className="text-yellow-200 text-sm mt-1">{b}</p>
              ))}
            </div>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            {selectedStudent && (
              <button
                onClick={() => router.push(`/students/${studentId}`)}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-colors"
              >
                Lihat Profil Siswa
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-xl transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">🏃 Penilaian Baru</h1>
          {!isOnline && (
            <div className="mt-2 bg-red-900/60 border border-red-700 rounded-lg px-4 py-2 text-red-300 text-sm">
              ⚠️ Mode Offline — data akan disimpan lokal
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="flex gap-2 mb-6">
          {["1 Siswa", "2 Lapangan", "3 Rubrik", "4 Simpan"].map((label, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${i < step - 1 ? "bg-green-500" : i === step - 1 ? "bg-yellow-400" : "bg-gray-700"}`} />
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ─── STEP 1 ─────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
            <h2 className="text-white text-lg font-bold">Langkah 1: Siswa & Antropometri</h2>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Siswa *</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className}) — NISN {s.nisn}
                  </option>
                ))}
              </select>
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
                    {s.name} — {s.stepHeightCm}cm ({s.material})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Jenis Tes *</label>
              <div className="flex gap-2">
                {(["PRE_TEST", "POST_TEST", "PRACTICE"] as TestType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTestType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors
                                ${testType === t
                                  ? "bg-yellow-400 text-gray-900"
                                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                  >
                    {t === "PRE_TEST" ? "Pre-Test" : t === "POST_TEST" ? "Post-Test" : "Latihan"}
                  </button>
                ))}
              </div>
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

        {/* ─── STEP 2 ─────────────────────────────────────────────────────── */}
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
                    className={`flex-1 py-3 rounded-xl font-bold transition-colors
                                ${trackDist === String(d)
                                  ? "bg-yellow-400 text-gray-900"
                                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <Stopwatch onStop={(s) => setDuration(s)} />

            <div className="bg-gray-900 rounded-2xl p-4">
              <div className="flex justify-around">
                <CounterButton
                  label="Jatuh"
                  icon="⬇️"
                  color="red"
                  onChange={setFallCount}
                />
                <CounterButton
                  label="Langkah"
                  icon="👟"
                  color="blue"
                  onChange={setStepCount}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl">← Kembali</button>
              <button
                onClick={submitStep2}
                className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl transition-colors"
              >
                Lanjut ke Rubrik →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3 ─────────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-white text-lg font-bold">Langkah 3: Penilaian Rubrik</h2>
            <RubrikForm sessionKey={`rubrik_${studentId}`} onComplete={handleRubrikComplete} />
            <button onClick={() => setStep(2)} className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl">← Kembali</button>
          </div>
        )}

        {/* ─── STEP 4: Konfirmasi ──────────────────────────────────────────── */}
        {step === 4 && rubrikScores && (
          <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-white text-lg font-bold">Langkah 4: Konfirmasi & Simpan</h2>

            {selectedStudent && (
              <div className="bg-gray-800 rounded-xl p-4 text-sm space-y-1">
                <p className="text-gray-300"><span className="text-gray-500">Siswa:</span> {selectedStudent.name} ({selectedStudent.className})</p>
                <p className="text-gray-300"><span className="text-gray-500">Tes:</span> {testType.replace("_", "-")}</p>
                <p className="text-gray-300"><span className="text-gray-500">TB/BB:</span> {heightCm}cm / {weightKg}kg</p>
                <p className="text-gray-300"><span className="text-gray-500">Waktu:</span> {duration}s • Jarak: {trackDist}m • Jatuh: {fallCount}x</p>
                <p className="text-gray-300">
                  <span className="text-gray-500">Rubrik:</span>{" "}
                  Statis {rubrikScores.scoreStatic} · Dinamis {rubrikScores.scoreDynamic} · Koordinasi {rubrikScores.scoreCoord} · Postur {rubrikScores.scorePosture}
                </p>
              </div>
            )}

            {!isOnline && (
              <p className="text-orange-400 text-sm bg-orange-900/30 border border-orange-700 rounded-xl px-4 py-2">
                Mode offline — disimpan ke perangkat, sync otomatis saat online.
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl">← Kembali</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
              >
                {saving ? "Menyimpan…" : (isOnline ? "✅ Simpan ke Server" : "💾 Simpan Offline")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
