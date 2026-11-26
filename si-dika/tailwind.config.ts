import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Design Tokens: Mode Lapangan (High-Contrast) ───────────────────────
      // Sesuai design.md §6.2
      colors: {
        field: {
          bg:      "#0A0A0A", // Background utama (hitam pekat)
          surface: "#1A1A1A", // Card / panel
          primary: "#FACC15", // Tombol Start, angka stopwatch (kuning cerah)
          danger:  "#EF4444", // Tombol Stop, counter Jatuh
          success: "#22C55E", // Status Tersimpan, badge Synced
          muted:   "#9CA3AF", // Teks sekunder
          text:    "#F9FAFB", // Teks utama (putih)
          border:  "#2D2D2D", // Border subtle
        },
      },
      // ─── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Stopwatch display (design.md §6.3)
        "stopwatch": ["4.5rem", { lineHeight: "1", fontWeight: "700" }],
        "counter":   ["3rem",   { lineHeight: "1", fontWeight: "700" }],
      },
      // ─── Spacing / Sizing ───────────────────────────────────────────────────
      minHeight: {
        "tap-target": "64px",   // Minimum tombol utama
        "counter-btn": "80px",  // Counter Jatuh / Langkah (design.md §6.3)
      },
      minWidth: {
        "tap-target": "64px",
        "counter-btn": "80px",
      },
      // ─── Breakpoints (design.md §6.5) ───────────────────────────────────────
      screens: {
        // Default Tailwind: sm=640, md=768, lg=1024, xl=1280
        // Tambahan alias semantik
        "field":     { max: "639px" },   // Smartphone lapangan
        "tablet":    { min: "640px", max: "1023px" },
        "desktop":   { min: "1024px" },
      },
    },
  },
  plugins: [],
};

export default config;
