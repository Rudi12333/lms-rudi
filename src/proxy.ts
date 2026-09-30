import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readToken } from "@/lib/session";
import { ROLE_HOME, isRole } from "@/lib/constants";

const PUBLIK = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIK.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const session = await readToken(request.cookies.get("lms_session")?.value);

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Cegah user membuka dashboard role lain.
  if (!isRole(session.role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  // Admin boleh akses semua dashboard, selain itu sesuai prefix role-nya.
  const prefix = `/dashboard/${session.role.toLowerCase()}`;
  const isOwnDashboard =
    pathname === prefix || pathname.startsWith(`${prefix}/`);

  if (
    pathname.startsWith("/dashboard") &&
    !isOwnDashboard &&
    session.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)",
  ],
};
