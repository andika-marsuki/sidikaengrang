"use client";
// =============================================================================
// SI-DIKA — RubrikForm: Wizard 4-Langkah Penilaian Rubrik
// TASK-5.7 (REQ-3.1, REQ-3.2)
// Setiap skor 1–4 menampilkan deskripsi kriteria; state disimpan ke localStorage
// sebagai crash recovery.
// =============================================================================

import { useState, useEffect } from "react";

export interface RubrikScores {
  scoreStatic:  number;
  scoreDynamic: number;
  scoreCoord:   number;
  scorePosture: number;
}

interface RubrikStep {
  key:   keyof RubrikScores;
  label: string;
  icon:  string;
  criteria: { score: number; title: string; description: string }[];
}

const RUBRIK_STEPS: RubrikStep[] = [
  {
    key:   "scoreStatic",
    label: "Keseimbangan Statis",
    icon:  "🧍",
    criteria: [
      { score: 1, title: "Tidak Mampu",    description: "Tidak dapat berdiri diam di atas engrang lebih dari 2 detik tanpa bantuan." },
      { score: 2, title: "Perlu Bantuan",  description: "Berdiri diam 2–5 detik, sesekali perlu menyentuh permukaan untuk keseimbangan." },
      { score: 3, title: "Cukup Stabil",   description: "Berdiri diam 5–10 detik secara konsisten tanpa bantuan." },
      { score: 4, title: "Sangat Stabil",  description: "Berdiri diam >10 detik dengan postur tegak dan kendali penuh." },
    ],
  },
  {
    key:   "scoreDynamic",
    label: "Keseimbangan Dinamis",
    icon:  "🚶",
    criteria: [
      { score: 1, title: "Tidak Mampu",    description: "Tidak dapat melangkah tanpa langsung jatuh; pusat gravitasi tidak terkontrol." },
      { score: 2, title: "Tidak Stabil",   description: "Dapat melangkah 2–4 langkah tetapi badan berayun besar kiri-kanan." },
      { score: 3, title: "Cukup Stabil",   description: "Berjalan 5+ langkah dengan ayunan tubuh kecil, sesekali terkoreksi." },
      { score: 4, title: "Sangat Stabil",  description: "Berjalan dengan ritme lancar, pusat gravitasi tetap terpusat sepanjang lintasan." },
    ],
  },
  {
    key:   "scoreCoord",
    label: "Koordinasi Mata-Tangan-Kaki",
    icon:  "👁️",
    criteria: [
      { score: 1, title: "Tidak Terkoordinasi", description: "Pandangan ke bawah terus; gerakan tangan dan kaki tidak sinkron." },
      { score: 2, title: "Kurang Sinkron",      description: "Sesekali memandang ke depan, tetapi ritme tangan dan kaki tidak konsisten." },
      { score: 3, title: "Cukup Terkoordinasi", description: "Memandang 3–5 m ke depan, ritme tangan dan kaki mulai sinkron." },
      { score: 4, title: "Terkoordinasi Penuh", description: "Pandangan tetap ke depan, tangan dan kaki bergerak dalam ritme yang sepenuhnya sinkron." },
    ],
  },
  {
    key:   "scorePosture",
    label: "Daya Tahan Postur & Genggaman",
    icon:  "💪",
    criteria: [
      { score: 1, title: "Sangat Lemah",   description: "Badan bungkuk dalam 10 detik pertama; genggaman terlepas berkali-kali." },
      { score: 2, title: "Lemah",          description: "Postur mulai membungkuk setelah separuh lintasan; genggaman sering dikencangkan ulang." },
      { score: 3, title: "Cukup Kuat",     description: "Postur tegak sepanjang lintasan, genggaman stabil dengan 1–2 penyesuaian." },
      { score: 4, title: "Sangat Kuat",    description: "Postur tegak sempurna hingga akhir; genggaman kuat tanpa penyesuaian." },
    ],
  },
];

interface RubrikFormProps {
  sessionKey?: string;      // key untuk crash recovery di localStorage
  onComplete?: (scores: RubrikScores) => void;
}

export default function RubrikForm({ sessionKey = "rubrik_draft", onComplete }: RubrikFormProps) {
  const [step, setStep]     = useState(0);
  const [scores, setScores] = useState<Partial<RubrikScores>>({});
  const [done, setDone]     = useState(false);

  // Muat draft dari localStorage (crash recovery)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setScores(parsed.scores ?? {});
        setStep(parsed.step ?? 0);
      }
    } catch {}
  }, [sessionKey]);

  const currentStep = RUBRIK_STEPS[step];

  const selectScore = (score: number) => {
    const newScores = { ...scores, [currentStep.key]: score };
    setScores(newScores);

    // Simpan ke localStorage segera (crash recovery)
    try {
      localStorage.setItem(sessionKey, JSON.stringify({ scores: newScores, step }));
    } catch {}

    if (step < RUBRIK_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Selesai
      const finalScores = newScores as RubrikScores;
      setDone(true);
      try { localStorage.removeItem(sessionKey); } catch {}
      onComplete?.(finalScores);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const reset = () => {
    setScores({});
    setStep(0);
    setDone(false);
    try { localStorage.removeItem(sessionKey); } catch {}
  };

  if (done) {
    const s = scores as RubrikScores;
    return (
      <div className="bg-gray-900 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-white text-xl font-bold mb-4">Rubrik Selesai</h3>
        <div className="grid grid-cols-2 gap-3 text-left">
          {RUBRIK_STEPS.map((rs) => (
            <div key={rs.key} className="bg-gray-800 rounded-xl p-3">
              <p className="text-gray-400 text-xs">{rs.icon} {rs.label}</p>
              <p className="text-yellow-300 text-2xl font-bold mt-1">{s[rs.key]}/4</p>
            </div>
          ))}
        </div>
        <button onClick={reset} className="mt-5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-xl">
          ↺ Isi Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 select-none">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6">
        {RUBRIK_STEPS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i < step ? "bg-green-500" : i === step ? "bg-yellow-400" : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-4xl">{currentStep.icon}</span>
        <h3 className="text-white text-lg font-bold mt-2">{currentStep.label}</h3>
        <p className="text-gray-400 text-sm mt-1">Langkah {step + 1} dari {RUBRIK_STEPS.length}</p>
      </div>

      {/* Pilihan skor */}
      <div className="space-y-3">
        {currentStep.criteria.map((c) => {
          const isSelected = scores[currentStep.key] === c.score;
          return (
            <button
              key={c.score}
              onClick={() => selectScore(c.score)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all min-h-[72px]
                          ${isSelected
                            ? "border-yellow-400 bg-yellow-900/40"
                            : "border-gray-700 bg-gray-800 hover:border-gray-500 hover:bg-gray-700"
                          }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start gap-3">
                <span className={`text-2xl font-bold font-mono min-w-[2rem] text-center
                                  ${isSelected ? "text-yellow-300" : "text-gray-400"}`}>
                  {c.score}
                </span>
                <div>
                  <p className={`font-semibold text-sm ${isSelected ? "text-yellow-200" : "text-gray-200"}`}>
                    {c.title}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{c.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigasi */}
      {step > 0 && (
        <button
          onClick={goBack}
          className="mt-5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-xl"
        >
          ← Kembali
        </button>
      )}
    </div>
  );
}
