import type { Metadata } from "next";
import GuestWizard from "./GuestWizard";

export const metadata: Metadata = {
  title: "Coba Penilaian — SI-DIKA",
  description: "Coba penilaian egrang secara gratis tanpa perlu akun.",
};

// Halaman ini sepenuhnya statis — specs diambil oleh GuestWizard via API di client
export default function TryPage() {
  return <GuestWizard />;
}
