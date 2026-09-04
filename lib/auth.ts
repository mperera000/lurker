import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { authConfig } from "@/auth.config";

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET &&
      ((process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) ||
        process.env.AUTH_RESEND_KEY),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD
      ? [
          Credentials({
            name: "Admin",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
              const email = String(credentials?.email ?? "");
              const password = String(credentials?.password ?? "");
              if (
                email === process.env.ADMIN_EMAIL &&
                password === process.env.ADMIN_PASSWORD
              ) {
                return { id: "admin", email, name: "Watcher admin" };
              }
              return null;
            },
          }),
        ]
      : []),
    ...(process.env.AUTH_RESEND_KEY && process.env.ADMIN_EMAIL
      ? [
          Resend({
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.AUTH_EMAIL_FROM ?? "noreply@example.com",
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn: async ({ user, account }) => {
      if (account?.provider === "resend") {
        return user.email === process.env.ADMIN_EMAIL;
      }
      return true;
    },
  },
});
