// =============================================================================
// SI-DIKA — API Route: Students (CRUD)
// TASK-3.1
// GET  /api/students       — list siswa dengan filter + pagination
// POST /api/students       — buat siswa baru
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { studentSchema } from "@/schemas/student.schema";
import type { NextRequest } from "next/server";

// ── GET /api/students ──────────────────────────────────────────────────────

interface StudentsQueryParams {
  className?: string;
  academicYear?: string;
  page?: string;
  limit?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Hanya ADMIN dan TEACHER yang boleh list siswa
    await requireRole(["ADMIN", "TEACHER"]);

    const { searchParams } = new URL(request.url);
    const className     = searchParams.get("className") ?? undefined;
    const academicYear  = searchParams.get("academicYear") ?? undefined;
    const page          = parseInt(searchParams.get("page") ?? "1");
    const limit         = parseInt(searchParams.get("limit") ?? "20");
    const skip          = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };
    if (className)    where.className    = className;
    if (academicYear) where.academicYear = academicYear;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ className: "asc" }, { name: "asc" }],
        select: {
          id:           true,
          nisn:         true,
          name:         true,
          className:    true,
          academicYear: true,
          gender:       true,
          birthDate:    true,
          createdAt:    true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data:    students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[GET /api/students]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/students ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Hanya ADMIN dan TEACHER yang boleh buat siswa
    await requireRole(["ADMIN", "TEACHER"]);

    const body = await request.json();

    // Validasi dengan Zod
    const parsed = studentSchema.parse(body);

    // Cek duplikasi NISN
    const existing = await prisma.student.findUnique({
      where: { nisn: parsed.nisn },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `NISN ${parsed.nisn} sudah terdaftar.` },
        { status: 409 }
      );
    }

    // Buat siswa baru
    const student = await prisma.student.create({
      data: {
        nisn:         parsed.nisn,
        name:         parsed.name,
        className:    parsed.className,
        academicYear: parsed.academicYear,
        gender:       parsed.gender,
        birthDate:    new Date(parsed.birthDate),
      },
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
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
    console.error("[POST /api/students]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
