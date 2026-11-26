// =============================================================================
// SI-DIKA — API Route: Registrasi Akun
// POST /api/auth/register
//
// Membuat akun baru dengan role TEACHER (default untuk pengguna umum).
// Route ini publik (tidak memerlukan session).
// =============================================================================

import { NextResponse }  from "next/server";
import { prisma }        from "@/lib/prisma";
import bcrypt            from "bcryptjs";
import { createId }      from "@paralleldrive/cuid2";
import { z }             from "zod";

const registerSchema = z.object({
  name:     z.string().min(2, "Nama minimal 2 karakter").max(100),
  email:    z.string().email("Format email tidak valid").toLowerCase(),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

export async function POST(request: Request) {
  try {
    const body   = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Data tidak valid";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // Cek email sudah terdaftar
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        id:       createId(),
        name,
        email,
        password: hashedPassword,
        role:     "TEACHER",   // default role untuk pendaftar umum
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(
      { success: true, message: "Akun berhasil dibuat. Silakan login.", user },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan. Coba lagi." }, { status: 500 });
  }
}
