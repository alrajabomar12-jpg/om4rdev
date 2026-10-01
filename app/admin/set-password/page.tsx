import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { SetPasswordForm } from "@/components/admin/SetPasswordForm";
import { getSession } from "@/lib/auth/session";

export default async function SetPasswordPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!session.mustChangePassword) redirect("/admin");

  return (
    <AuthCard
      title="Set a new password"
      description="Before you can edit the site, replace the initial password with your own. This signs out every other session."
    >
      <SetPasswordForm />
    </AuthCard>
  );
}
