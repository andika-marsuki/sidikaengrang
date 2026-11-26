// =============================================================================
// SI-DIKA — API Route: Import Siswa dari CSV/Excel
// TASK-3.2 (REQ-1.1)
// POST /api/students/import — terima file multipart/form-data
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { studentSchema } from "@/schemas/student.schema";
import type { Gender } from "@prisma/client";

interface ImportRow {
  nisn: string;
  nama: string;
  kelas: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  tahun_ajaran?: string;
}

interface ImportResult {
  success: boolean;
  row: number;
  nisn: string;
  name: string;
  error?: string;
}

export async function POST(request: Request) {
  try {
    // Hanya ADMIN dan TEACHER yang boleh import
    await requireRole(["ADMIN", "TEACHER"]);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileType = file.name.toLowerCase().endsWith(".csv") ? "csv" : "excel";

    let rows: ImportRow[] = [];

    // ── Parse CSV ────────────────────────────────────────────────────────────
    if (fileType === "csv") {
      const text = new TextDecoder().decode(buffer);
      const parsed = Papa.parse<ImportRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase(),
      });
      rows = parsed.data;
    }

    // ── Parse Excel ──────────────────────────────────────────────────────────
    else {
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: "" });

      // Normalize keys to lowercase
      rows = jsonData.map((row: any) => {
        const normalized: any = {};
        Object.keys(row).forEach((key) => {
          normalized[key.trim().toLowerCase()] = row[key];
        });
        return normalized as ImportRow;
      });
    }

    // ── Validasi dan Import ──────────────────────────────────────────────────
    const results: ImportResult[] = [];
    const currentYear = new Date().getFullYear();
    const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel/CSV row number (header = 1, data starts at 2)

      try {
        // Validasi kolom wajib
        if (!row.nisn || !row.nama || !row.kelas || !row.jenis_kelamin || !row.tanggal_lahir) {
          results.push({
            success: false,
            row: rowNum,
            nisn: row.nisn ?? "",
            name: row.nama ?? "",
            error: "Kolom wajib tidak lengkap (nisn, nama, kelas, jenis_kelamin, tanggal_lahir)",
          });
          continue;
        }

        // Normalize gender
        const genderRaw = row.jenis_kelamin.trim().toUpperCase();
        let gender: Gender;
        if (genderRaw === "L" || genderRaw === "LAKI-LAKI") {
          gender = "L";
        } else if (genderRaw === "P" || genderRaw === "PEREMPUAN") {
          gender = "P";
        } else {
          results.push({
            success: false,
            row: rowNum,
            nisn: row.nisn,
            name: row.nama,
            error: `Jenis kelamin tidak valid: "${row.jenis_kelamin}" (harus L/P atau Laki-laki/Perempuan)`,
          });
          continue;
        }

        // Normalize birthDate
        let birthDate: Date;
        try {
          // Jika Excel, kemungkinan sudah Date object
          if (typeof row.tanggal_lahir === "number") {
            // Excel serial date
            birthDate = XLSX.SSF.parse_date_code(row.tanggal_lahir);
          } else {
            birthDate = new Date(row.tanggal_lahir);
            if (isNaN(birthDate.getTime())) {
              throw new Error("Invalid date");
            }
          }
        } catch {
          results.push({
            success: false,
            row: rowNum,
            nisn: row.nisn,
            name: row.nama,
            error: `Format tanggal lahir tidak valid: "${row.tanggal_lahir}"`,
          });
          continue;
        }

        // Validasi dengan Zod
        const parsed = studentSchema.parse({
          nisn: row.nisn.trim(),
          name: row.nama.trim(),
          className: row.kelas.trim(),
          academicYear: row.tahun_ajaran?.trim() ?? defaultAcademicYear,
          gender,
          birthDate: birthDate.toISOString(),
        });

        // Cek duplikasi NISN
        const existing = await prisma.student.findUnique({
          where: { nisn: parsed.nisn },
        });

        if (existing) {
          results.push({
            success: false,
            row: rowNum,
            nisn: parsed.nisn,
            name: parsed.name,
            error: `NISN ${parsed.nisn} sudah terdaftar`,
          });
          continue;
        }

        // Insert ke database
        await prisma.student.create({
          data: {
            nisn: parsed.nisn,
            name: parsed.name,
            className: parsed.className,
            academicYear: parsed.academicYear,
            gender: parsed.gender,
            birthDate: new Date(parsed.birthDate),
          },
        });

        results.push({
          success: true,
          row: rowNum,
          nisn: parsed.nisn,
          name: parsed.name,
        });
      } catch (error: any) {
        results.push({
          success: false,
          row: rowNum,
          nisn: row.nisn ?? "",
          name: row.nama ?? "",
          error: error.message ?? "Validasi gagal",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${successCount} berhasil, ${failCount} gagal`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error: any) {
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[POST /api/students/import]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
