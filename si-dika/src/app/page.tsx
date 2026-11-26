import { redirect } from "next/navigation";

/**
 * Root "/" — langsung redirect ke dashboard.
 * Auth middleware akan menangani redirect ke /login jika belum login.
 */
export default function RootPage() {
  redirect("/dashboard");
}
