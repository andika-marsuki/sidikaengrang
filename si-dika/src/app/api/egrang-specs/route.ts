// =============================================================================
// SI-DIKA — API Route: EgrangSpec (CRUD)
// TASK-3.5 (REQ-1.3)
// GET  /api/egrang-specs  — list semua spesifikasi egrang
// POST /api/egrang-specs  — buat spesifikasi baru
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

// ── GET /api/egrang-specs ──────────────────────────────────────────────────

export async function GET() {
  try {
    // Semua role bisa melihat specs
    const specs = await prisma.egrangSpec.findMany({
      orderBy: { stepHeightCm: "asc" },
      select: {
        id:           true,
        name:         true,
        stepHeightCm: true,
        poleLengthCm: true,
        material:     true,
        createdAt:    true,
      },
    });

    return NextResponse.json({ success: true, data: specs });
  } catch (error: any) {
    console.error("[GET /api/egrang-specs]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/egrang-specs ─────────────────────────────────────────────────

const egrangSpecSchema = z.object({
  name: z
    .string()
    .min(5, "Nama spesifikasi minimal 5 karakter")
    .max(100, "Nama spesifikasi maksimal 100 karakter"),

  stepHeightCm: z
    .number()
    .int("Tinggi pijakan harus bilangan bulat")
    .min(10, "Tinggi pijakan minimal 10 cm")
    .max(60, "Tinggi pijakan maksimal 60 cm"),

  poleLengthCm: z
    .number()
    .int("Panjang tongkat harus bilangan bulat")
    .min(50, "Panjang tongkat minimal 50 cm")
    .max(250, "Panjang tongkat maksimal 250 cm"),

  material: z
    .string()
    .min(3, "Material wajib diisi")
    .max(50, "Material maksimal 50 karakter"),
});

export async function POST(request: Request) {
  try {
    // Hanya ADMIN dan TEACHER yang boleh buat spec
    await requireRole(["ADMIN", "TEACHER"]);

    const body = await request.json();

    // Validasi dengan Zod
    const parsed = egrangSpecSchema.parse(body);

    // Buat spec baru
    const spec = await prisma.egrangSpec.create({
      data: {
        name:         parsed.name,
        stepHeightCm: parsed.stepHeightCm,
        poleLengthCm: parsed.poleLengthCm,
        material:     parsed.material,
      },
    });

    return NextResponse.json({ success: true, data: spec }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validasi gagal", details: error.errors },
        { status: 400 }
      );
    }
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[POST /api/egrang-specs]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
