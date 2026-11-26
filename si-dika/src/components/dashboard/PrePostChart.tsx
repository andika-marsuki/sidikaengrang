"use client";
// =============================================================================
// SI-DIKA — PrePostChart: Grafik Bar Pre vs Post Test per Indikator
// TASK-6.2 (REQ-5.1) — Recharts
// =============================================================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AssessmentScores {
  scoreStatic:  number;
  scoreDynamic: number;
  scoreCoord:   number;
  scorePosture: number;
  finalScore:   number;
  predicate:    string;
  testType:     string;
}

interface PrePostChartProps {
  preTest?:  AssessmentScores | null;
  postTest?: AssessmentScores | null;
}

const INDICATORS = [
  { key: "scoreStatic",  label: "Statis" },
  { key: "scoreDynamic", label: "Dinamis" },
  { key: "scoreCoord",   label: "Koordinasi" },
  { key: "scorePosture", label: "Postur" },
];

export default function PrePostChart({ preTest, postTest }: PrePostChartProps) {
  if (!preTest && !postTest) return null;

  const data = INDICATORS.map((ind) => ({
    name:    ind.label,
    "Pre-Test":  preTest  ? (preTest  as any)[ind.key] : null,
    "Post-Test": postTest ? (postTest as any)[ind.key] : null,
  }));

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
        {preTest && (
          <div className="flex-1 min-w-[120px] bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-600 font-semibold uppercase">Pre-Test</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{preTest.finalScore}</p>
            <p className="text-sm text-blue-500 mt-0.5">{preTest.predicate}</p>
          </div>
        )}
        {postTest && (
          <div className="flex-1 min-w-[120px] bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-xs text-green-600 font-semibold uppercase">Post-Test</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{postTest.finalScore}</p>
            <p className="text-sm text-green-500 mt-0.5">{postTest.predicate}</p>
          </div>
        )}
        {preTest && postTest && postTest.finalScore > preTest.finalScore && (
          <div className="flex-1 min-w-[120px] bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-xs text-yellow-700 font-semibold uppercase">Peningkatan</p>
            <p className="text-3xl font-bold text-yellow-700 mt-1">
              +{(postTest.finalScore - preTest.finalScore).toFixed(1)}
            </p>
            <p className="text-sm text-yellow-600 mt-0.5">
              {(((postTest.finalScore - preTest.finalScore) / preTest.finalScore) * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Bar chart indikator rubrik (skala 1–4) */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
          <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} tick={{ fontSize: 11, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
            formatter={(value: any) => [value === null ? "–" : `${value}/4`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {preTest  && <Bar dataKey="Pre-Test"  fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />}
          {postTest && <Bar dataKey="Post-Test" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
