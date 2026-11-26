// =============================================================================
// SI-DIKA — API Route: Student Detail (Single)
// TASK-3.1
// GET    /api/students/[id]  — detail siswa + riwayat assessment
// PATCH  /api/students/[id]  — update data siswa
// DELETE /api/students/[id]  — hapus siswa (soft delete)
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, canAccessStudent, getCurrentUser } from "@/lib/auth";
import { studentSchema } from "@/schemas/student.schema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET /api/students/[id] ─────────────────────────────────────────────────

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Login diperlukan" }, { status: 401 });
    }

    const params = await context.params;
    const studentId = params.id;

    // Periksa izin akses
    const hasAccess = await canAccessStudent(user.id, user.role, studentId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak" },
        { status: 403 }
      );
    }

    // Ambil data siswa + riwayat assessment
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        assessments: {
          orderBy: { assessedAt: "desc" },
          take: 10, // 10 assessment terakhir
          select: {
            id:              true,
            testType:        true,
            finalScore:      true,
            predicate:       true,
            assessedAt:      true,
            teacher:         { select: { name: true } },
            egrangSpec:      { select: { name: true } },
            durationSeconds: true,
            fallCount:       true,
          },
        },
        badges: {
          orderBy: { awardedAt: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    console.error("[GET /api/students/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/students/[id] ───────────────────────────────────────────────

export async function PATCH(request: Request, context: RouteContext) {
  try {
    // Hanya ADMIN dan TEACHER yang boleh update
    await requireRole(["ADMIN", "TEACHER"]);

    const params = await context.params;
    const studentId = params.id;
    const body = await request.json();

    // Validasi partial update (semua field optional kecuali yang di-submit)
    const parsed = studentSchema.partial().parse(body);

    // Update siswa
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(parsed.name && { name: parsed.name }),
        ...(parsed.className && { className: parsed.className }),
        ...(parsed.academicYear && { academicYear: parsed.academicYear }),
        ...(parsed.gender && { gender: parsed.gender }),
        ...(parsed.birthDate && { birthDate: new Date(parsed.birthDate) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validasi gagal", details: error.errors },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[PATCH /api/students/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/students/[id] ──────────────────────────────────────────────

export async function DELETE(request: Request, context: RouteContext) {
  try {
    // Hanya ADMIN yang boleh hapus
    await requireRole(["ADMIN"]);

    const params = await context.params;
    const studentId = params.id;

    // Soft delete: set isActive = false
    await prisma.student.update({
      where: { id: studentId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Siswa berhasil dihapus (soft delete)" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("[DELETE /api/students/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
