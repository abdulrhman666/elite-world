import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";

export default async function SensitiveSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?error=session");
  if (session.role !== "SUPER_ADMIN") redirect("/admin?error=forbidden");
  return children;
}
