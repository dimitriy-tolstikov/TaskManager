import { NextResponse, type NextRequest } from "next/server";

import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const response = NextResponse.next();
  if (session) {
    // Sliding session: any activity re-issues the cookie with a fresh maxAge.
    const freshToken = await createSessionToken(session);
    response.cookies.set(SESSION_COOKIE, freshToken, sessionCookieOptions);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};
