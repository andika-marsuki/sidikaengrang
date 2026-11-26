// =============================================================================
// SI-DIKA — BMI Calculator & Egrang Step Height Recommendation
// REQ-1.2
// =============================================================================

/**
 * Menghitung Body Mass Index (BMI).
 * @param heightCm Tinggi badan dalam sentimeter
 * @param weightKg Berat badan dalam kilogram
 * @returns BMI (dibulatkan 1 desimal)
 */
export function calcBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) {
    throw new Error("Tinggi dan berat harus bernilai positif.");
  }
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Kategori BMI sesuai standar WHO untuk anak/remaja (referensi umum).
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Kurang Berat";
  if (bmi < 25.0) return "Normal";
  if (bmi < 30.0) return "Kelebihan Berat";
  return "Obesitas";
}

/**
 * Merekomendasikan tinggi pijakan engrang yang aman berdasarkan tinggi badan siswa.
 *
 * Prinsip: pijakan ≈ 15–25% tinggi badan agar masih bisa mendarat dengan aman.
 * - Tinggi badan < 130 cm → pijakan 15–20 cm (maks 20 cm)
 * - Tinggi badan 130–159 cm → pijakan 20–30 cm
 * - Tinggi badan ≥ 160 cm → pijakan 30–40 cm
 *
 * @returns objek dengan minCm dan maxCm (dalam sentimeter)
 */
export function recommendStepHeight(heightCm: number): {
  minCm: number;
  maxCm: number;
  label: string;
} {
  if (heightCm < 130) {
    return { minCm: 15, maxCm: 20, label: "15–20 cm (pijakan rendah, aman untuk pemula)" };
  }
  if (heightCm < 160) {
    return { minCm: 20, maxCm: 30, label: "20–30 cm (pijakan standar SD/SMP)" };
  }
  return { minCm: 30, maxCm: 40, label: "30–40 cm (pijakan standar SMP/SMA)" };
}
