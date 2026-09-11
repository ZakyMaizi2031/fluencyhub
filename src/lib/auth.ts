import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createUser, getUserByEmail, updateUserLastLogin } from "@/lib/db/users.queries";

export function getAuthSecret() {
  const env = process.env;
  return (env["NEXTAUTH_SECRET"] || env["AUTH_SECRET"] || "").trim();
}

export function getAuthOptions(): NextAuthOptions {
  return {
    secret: getAuthSecret() || undefined,
    providers: [
      GoogleProvider({
        clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
        clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
      }),
    ],
    session: { strategy: "jwt" },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    callbacks: {
      async signIn({ user }) {
        if (!user.email) return false;
        return true;
      },
      async jwt({ token, user, account }) {
        if (user?.email) {
          let dbUser = await getUserByEmail(user.email);
          if (!dbUser) {
            dbUser = await createUser({
              name: user.name ?? user.email,
              email: user.email,
              googleId: account?.providerAccountId ?? null,
              avatarUrl: user.image ?? null,
              role: "user",
            });
          }
          await updateUserLastLogin(dbUser.id);
          token.id = String(dbUser.id);
          token.role = dbUser.role;
        } else if (token.email && !token.id) {
          const dbUser = await getUserByEmail(token.email);
          if (dbUser) {
            token.id = String(dbUser.id);
            token.role = dbUser.role;
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id ?? "";
          session.user.role = token.role ?? "user";
        }
        return session;
      },
    },
  };
}

/** Lazily resolved so the secret is read at request time, not at build time. */
export const authOptions: NextAuthOptions = new Proxy({} as NextAuthOptions, {
  get(_target, prop, receiver) {
    return Reflect.get(getAuthOptions(), prop, receiver);
  },
  ownKeys() {
    return Reflect.ownKeys(getAuthOptions());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getAuthOptions(), prop);
  },
});

export function getAdminPath() {
  return process.env["ADMIN_PATH"] ?? "fh-admin";
}

export function isAdminEmail(email: string | null | undefined) {
  const list = (process.env["ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!email) return false;
  return list.includes(email.toLowerCase());
}
