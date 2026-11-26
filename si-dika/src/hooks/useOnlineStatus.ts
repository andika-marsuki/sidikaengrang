"use client";
// =============================================================================
// SI-DIKA — Hook: useOnlineStatus
// TASK-5.3
// Menggabungkan navigator.onLine dengan periodic ping ke /api/health
// untuk deteksi status koneksi yang lebih andal.
// =============================================================================

import { useState, useEffect, useRef } from "react";

const PING_INTERVAL_MS = 10_000; // ping setiap 10 detik
const PING_TIMEOUT_MS  = 4_000;  // timeout 4 detik

async function pingServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    const res = await fetch("/api/health", {
      method: "GET",
      cache:  "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Langsung ping saat mount
    pingServer().then(setIsOnline);

    // Ping berkala
    intervalRef.current = setInterval(async () => {
      const online = await pingServer();
      setIsOnline(online);
    }, PING_INTERVAL_MS);

    // Listener native online/offline
    const handleOnline  = () => pingServer().then(setIsOnline);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
