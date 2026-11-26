// =============================================================================
// SI-DIKA — Zod Schema: Student
// Digunakan untuk validasi input API POST/PATCH /api/students
// =============================================================================

import { z } from "zod";

export const studentSchema = z.object({
  nisn: z
    .string()
    .length(10, "NISN harus 10 digit")
    .regex(/^\d{10}$/, "NISN harus berisi angka saja"),

  name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter"),

  className: z
    .string()
    .min(1, "Kelas wajib diisi")
    .regex(/^[IVX]+-[A-Z]$/, "Format kelas tidak valid (contoh: VII-A, VIII-B)"),

  academicYear: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran tidak valid (contoh: 2024/2025)"),

  gender: z
    .enum(["L", "P"], { errorMap: () => ({ message: "Jenis kelamin harus L atau P" }) }),

  birthDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Format tanggal lahir tidak valid"),
});

export type StudentInput = z.infer<typeof studentSchema>;
