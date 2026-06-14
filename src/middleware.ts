import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/applications",
  "/kanban",
  "/resumes",
  "/analytics",
  "/ai",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/u/") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/jobs");

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!isLoggedIn && !isAuthPage && !isPublic && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
