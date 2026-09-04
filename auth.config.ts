import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? "dev-only-not-for-production",
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized: async ({ auth, request }) => {
      const configured = Boolean(
        process.env.AUTH_SECRET &&
          ((process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) ||
            process.env.AUTH_RESEND_KEY),
      );
      if (!configured) return true;
      const path = request.nextUrl.pathname;
      if (
        path.startsWith("/api/cron") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/login")
      ) {
        return true;
      }
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
