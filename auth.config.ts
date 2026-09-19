import type { NextAuthConfig } from "next-auth";
import { isPublicAuthPath } from "@/lib/auth-ready";

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? "dev-only-not-for-production",
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized: async ({ auth, request }) => {
      if (isPublicAuthPath(request.nextUrl.pathname)) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
