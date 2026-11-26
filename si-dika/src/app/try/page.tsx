import type { Metadata } from "next";
import GuestWizard from "./GuestWizard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Coba Penilaian — SI-DIKA",
  description: "Coba penilaian egrang secara gratis tanpa perlu akun.",
};

export default async function TryPage() {
  // Ambil daftar spesifikasi egrang dari DB untuk dipilih pengguna
  const egrangSpecs = await prisma.egrangSpec.findMany({
    orderBy: { stepHeightCm: "asc" },
    select: { id: true, name: true, stepHeightCm: true, poleLengthCm: true, material: true },
  });

  return <GuestWizard egrangSpecs={egrangSpecs} />;
}
