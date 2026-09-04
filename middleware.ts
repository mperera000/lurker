import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const configured = Boolean(
    process.env.AUTH_SECRET &&
      ((process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) ||
        process.env.AUTH_RESEND_KEY),
  );
  if (!configured) return NextResponse.next();

  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/api/cron") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/login")
  ) {
    return NextResponse.next();
  }

  if (!request.auth) {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
