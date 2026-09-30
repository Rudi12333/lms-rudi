import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { isRole, ROLE_HOME } from "@/lib/constants";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data tidak valid",
      },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Email atau password salah" },
      { status: 401 },
    );
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    return NextResponse.json(
      { ok: false, message: "Email atau password salah" },
      { status: 401 },
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { ok: false, message: "Akun Anda nonaktif. Hubungi admin." },
      { status: 403 },
    );
  }

  if (!isRole(user.role)) {
    return NextResponse.json(
      { ok: false, message: "Role akun tidak dikenali" },
      { status: 403 },
    );
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json({ ok: true, redirect: ROLE_HOME[user.role] });
}
