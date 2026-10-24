import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/register"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/tools", req.url));
  }

  if (pathname.startsWith("/owner") && token.role !== "TRADESMAN") {
    return NextResponse.redirect(new URL("/tools", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tools/:path*",
    "/rentals/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/owner/:path*",
    "/admin/:path*",
  ],
};
