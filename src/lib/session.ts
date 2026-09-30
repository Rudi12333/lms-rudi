import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./constants";

const SECRET =
  process.env.AUTH_SECRET ?? "lms-syahrudin-dev-secret-minimal-32-chars";
const COOKIE_NAME = "lms_session";
const MAX_AGE = 60 * 60 * 8; // 8 jam

const key = new TextEncoder().encode(SECRET);

export type SessionPayload = {
  userId: string;
  role: Role;
  name: string;
  email: string;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    const { userId, role, name, email } = payload as Record<string, unknown>;
    if (typeof userId !== "string" || typeof role !== "string") return null;
    return {
      userId,
      role: role as Role,
      name: typeof name === "string" ? name : "",
      email: typeof email === "string" ? email : "",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readToken(store.get(COOKIE_NAME)?.value);
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
