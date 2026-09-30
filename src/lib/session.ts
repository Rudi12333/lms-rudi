import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./constants";

const DEV_SECRET = "lms-syahrudin-dev-secret-minimal-32-chars";
const COOKIE_NAME = "lms_session";
const MAX_AGE = 60 * 60 * 8; // 8 jam

// Dievaluasi saat dipakai (bukan saat modul dimuat) agar `next build` tidak gagal
// hanya karena env belum tersedia. Di production secret WAJIB diisi: secret bawaan
// bersifat publik sehingga siapa pun bisa memalsukan token sesi.
function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET wajib diisi di lingkungan production");
    }
    return new TextEncoder().encode(DEV_SECRET);
  }
  return new TextEncoder().encode(secret);
}

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
    .sign(getKey());

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
    const { payload } = await jwtVerify(token, getKey());
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
