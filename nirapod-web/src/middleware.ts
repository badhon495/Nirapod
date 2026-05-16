import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/tracker", "/api/auth"];
const AUTH_ONLY_PATHS = ["/home", "/create-complaint", "/profile", "/notifications", "/livechat"];
const ADMIN_PATHS = ["/admin"];
const AUTHORITY_PATHS = ["/authority"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role ?? "";

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (
    AUTHORITY_PATHS.some((p) => pathname.startsWith(p)) &&
    !["POLICE", "FIRE", "CITY", "ANIMAL", "ADMIN"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
