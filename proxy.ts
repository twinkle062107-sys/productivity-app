import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ONLY = ["/sign-in"];
const PROTECTED = ["/dashboard", "/quests", "/coach", "/profile", "/achievements"];

/**
 * Next.js 16 route protection (replaces middleware.ts).
 * - Redirects unauthenticated users away from app routes to /sign-in.
 * - Redirects authenticated users away from /sign-in to /dashboard.
 */
export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  if (PROTECTED.some((path) => nextUrl.pathname === path || nextUrl.pathname.startsWith(`${path}/`))) {
    if (!isLoggedIn) {
      const signInUrl = new URL("/sign-in", nextUrl);
      signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  if (PUBLIC_ONLY.includes(nextUrl.pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
