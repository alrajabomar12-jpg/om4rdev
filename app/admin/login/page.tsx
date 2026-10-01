import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.mustChangePassword ? "/admin/set-password" : "/admin");

  return (
    <AuthCard title="Admin sign-in" description="Enter the admin password to edit om4r.dev.">
      <LoginForm />
    </AuthCard>
  );
}
