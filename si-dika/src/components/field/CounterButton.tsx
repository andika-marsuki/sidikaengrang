"use client";
// =============================================================================
// SI-DIKA — CounterButton: Tombol Tap Besar untuk Lapangan
// TASK-5.6 (REQ-2.2) — min 80×80px, high-contrast
// =============================================================================

import { useState, useCallback } from "react";

interface CounterButtonProps {
  label: string;
  icon?: string;
  color?: "red" | "blue" | "green";
  initialValue?: number;
  onChange?: (value: number) => void;
}

export default function CounterButton({
  label,
  icon = "👆",
  color = "blue",
  initialValue = 0,
  onChange,
}: CounterButtonProps) {
  const [count, setCount] = useState(initialValue);

  const colorMap = {
    red:   "bg-red-600   hover:bg-red-500   active:bg-red-700   border-red-400",
    blue:  "bg-blue-600  hover:bg-blue-500  active:bg-blue-700  border-blue-400",
    green: "bg-green-600 hover:bg-green-500 active:bg-green-700 border-green-400",
  };

  const tap = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  const reset = useCallback(() => {
    setCount(0);
    onChange?.(0);
  }, [onChange]);

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <p className="text-sm font-semibold text-gray-300 uppercase tracking-widest">{label}</p>

      {/* Tombol tap utama — min 80×80px */}
      <button
        onClick={tap}
        className={`w-28 h-28 rounded-2xl border-2 ${colorMap[color]}
                    text-white font-bold shadow-xl transition-transform active:scale-95
                    flex flex-col items-center justify-center gap-1`}
        aria-label={`Tambah ${label}`}
      >
        <span className="text-3xl">{icon}</span>
        <span className="text-4xl font-mono">{count}</span>
      </button>

      {/* Tombol reset kecil */}
      <button
        onClick={reset}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors"
        aria-label={`Reset ${label}`}
      >
        ↺ Reset
      </button>
    </div>
  );
}
