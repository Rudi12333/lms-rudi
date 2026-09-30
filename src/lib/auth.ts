import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";
import { ROLE_HOME, type Role } from "./constants";

/** Wajib login. Melempar redirect ke /login bila belum login. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Wajib login DAN role harus salah satu dari `roles`. */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect(ROLE_HOME[session.role]);
  }
  return session;
}
