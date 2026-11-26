"use client";
// =============================================================================
// SI-DIKA — Komponen Stopwatch Lapangan
// TASK-5.5 (REQ-2.1)
// High-contrast, presisi milidetik, tombol min 48×48px.
// =============================================================================

import { useState, useRef, useEffect, useCallback } from "react";

interface StopwatchProps {
  onStop?: (durationSeconds: number) => void;
  disabled?: boolean;
}

type StopwatchState = "idle" | "running" | "paused" | "stopped";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes      = Math.floor(totalSeconds / 60);
  const seconds      = totalSeconds % 60;
  const millis       = Math.floor((ms % 1000) / 10); // 2 digit
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(2, "0")}`;
}

export default function Stopwatch({ onStop, disabled = false }: StopwatchProps) {
  const [status, setStatus]       = useState<StopwatchState>("idle");
  const [elapsed, setElapsed]     = useState<number>(0); // ms

  const startTimeRef   = useRef<number>(0);  // performance.now() saat mulai/resume
  const elapsedBeforeRef = useRef<number>(0); // elapsed sebelum pause
  const rafRef         = useRef<number>(0);

  // ── Tick menggunakan requestAnimationFrame ────────────────────────────────
  const tick = useCallback(() => {
    const now = performance.now();
    setElapsed(elapsedBeforeRef.current + (now - startTimeRef.current));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startTicking = useCallback(() => {
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopTicking = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    return () => stopTicking();
  }, [stopTicking]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStart = () => {
    if (disabled) return;
    elapsedBeforeRef.current = 0;
    setElapsed(0);
    setStatus("running");
    startTicking();
  };

  const handlePause = () => {
    if (status !== "running") return;
    stopTicking();
    elapsedBeforeRef.current += performance.now() - startTimeRef.current;
    setStatus("paused");
  };

  const handleResume = () => {
    if (status !== "paused") return;
    setStatus("running");
    startTicking();
  };

  const handleStop = () => {
    if (status !== "running" && status !== "paused") return;
    stopTicking();
    const finalMs = status === "running"
      ? elapsedBeforeRef.current + (performance.now() - startTimeRef.current)
      : elapsedBeforeRef.current;
    const finalElapsed = Math.round(finalMs);
    setElapsed(finalElapsed);
    setStatus("stopped");
    onStop?.(parseFloat((finalElapsed / 1000).toFixed(2)));
  };

  const handleReset = () => {
    stopTicking();
    elapsedBeforeRef.current = 0;
    setElapsed(0);
    setStatus("idle");
  };

  // ── Warna display berdasarkan status ──────────────────────────────────────
  const displayColor =
    status === "running" ? "text-green-300" :
    status === "stopped" ? "text-yellow-300" :
    status === "paused"  ? "text-orange-300" :
    "text-white";

  return (
    <div className="bg-gray-900 rounded-2xl p-6 select-none">
      {/* Display */}
      <div className="text-center mb-6">
        <div
          className={`font-mono text-6xl font-bold tracking-wider ${displayColor} transition-colors duration-200`}
          aria-live="polite"
          aria-label={`Stopwatch: ${formatTime(elapsed)}`}
        >
          {formatTime(elapsed)}
        </div>
        <p className="text-gray-400 text-sm mt-2 uppercase tracking-widest">
          {status === "idle"    ? "Siap"     :
           status === "running" ? "Berjalan" :
           status === "paused"  ? "Dijeda"   :
           "Selesai"}
        </p>
      </div>

      {/* Tombol */}
      <div className="flex flex-wrap gap-3 justify-center">
        {status === "idle" && (
          <button
            onClick={handleStart}
            disabled={disabled}
            className="min-w-[80px] min-h-[56px] px-6 py-3 bg-green-500 hover:bg-green-400 active:bg-green-600
                       text-white text-lg font-bold rounded-xl transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            aria-label="Mulai stopwatch"
          >
            ▶ Mulai
          </button>
        )}

        {status === "running" && (
          <>
            <button
              onClick={handlePause}
              className="min-w-[80px] min-h-[56px] px-6 py-3 bg-orange-500 hover:bg-orange-400 active:bg-orange-600
                         text-white text-lg font-bold rounded-xl transition-colors shadow-lg"
              aria-label="Jeda stopwatch"
            >
              ⏸ Jeda
            </button>
            <button
              onClick={handleStop}
              className="min-w-[80px] min-h-[56px] px-6 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700
                         text-white text-lg font-bold rounded-xl transition-colors shadow-lg"
              aria-label="Stop stopwatch"
            >
              ⏹ Stop
            </button>
          </>
        )}

        {status === "paused" && (
          <>
            <button
              onClick={handleResume}
              className="min-w-[80px] min-h-[56px] px-6 py-3 bg-green-500 hover:bg-green-400 active:bg-green-600
                         text-white text-lg font-bold rounded-xl transition-colors shadow-lg"
              aria-label="Lanjutkan stopwatch"
            >
              ▶ Lanjut
            </button>
            <button
              onClick={handleStop}
              className="min-w-[80px] min-h-[56px] px-6 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700
                         text-white text-lg font-bold rounded-xl transition-colors shadow-lg"
              aria-label="Stop stopwatch"
            >
              ⏹ Stop
            </button>
          </>
        )}

        {(status === "paused" || status === "stopped" || status === "idle") && (
          <button
            onClick={handleReset}
            className="min-w-[80px] min-h-[56px] px-6 py-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-800
                       text-gray-200 text-lg font-bold rounded-xl transition-colors shadow-lg"
            aria-label="Reset stopwatch"
          >
            ↺ Reset
          </button>
        )}
      </div>

      {/* Hasil akhir */}
      {status === "stopped" && (
        <div className="mt-4 text-center bg-gray-800 rounded-xl p-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Waktu Dicatat</p>
          <p className="text-yellow-300 text-2xl font-bold font-mono mt-1">
            {(elapsed / 1000).toFixed(2)}s
          </p>
        </div>
      )}
    </div>
  );
}
