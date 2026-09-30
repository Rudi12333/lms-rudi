import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 px-4 py-10">
      <LoginForm />
    </main>
  );
}
