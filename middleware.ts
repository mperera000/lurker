import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isPublicAuthPath } from "@/lib/auth-ready";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const path = request.nextUrl.pathname;
  if (isPublicAuthPath(path)) {
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|be-nosy/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
