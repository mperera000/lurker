import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { isAuthConfigured } from "@/lib/auth-ready";
import { verifyUser } from "@/lib/users";

export { isAuthConfigured };

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: isAuthConfigured()
    ? [
        Credentials({
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          authorize: async (credentials) => {
            const email = normalizeEmail(credentials?.email);
            const password = String(credentials?.password ?? "");
            if (!isValidEmail(email) || !password) return null;
            const user = await verifyUser(email, password);
            if (!user) return null;
            return {
              id: user.id,
              email: user.email,
              name: user.displayName,
            };
          },
        }),
      ]
    : [],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      const userId = typeof token.userId === "string" ? token.userId : "";
      const email = typeof token.email === "string" ? token.email : "";
      session.user.id = userId;
      session.user.email = email;
      if (typeof token.name === "string") session.user.name = token.name;
      return session;
    },
  },
});
