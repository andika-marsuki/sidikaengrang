// =============================================================================
// SI-DIKA — API Route: GET /api/assessments/[id]
// TASK-5.1
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireRole(["ADMIN", "TEACHER", "STUDENT"]);

    const { id } = await params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        student:    { select: { id: true, name: true, nisn: true, className: true, birthDate: true, gender: true } },
        teacher:    { select: { id: true, name: true } },
        egrangSpec: true,
      },
    });

    if (!assessment) {
      return NextResponse.json({ success: false, error: "Assessment tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error: any) {
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    console.error("[GET /api/assessments/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
