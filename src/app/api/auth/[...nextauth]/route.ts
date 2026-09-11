import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

// Recreate options on every request so Vercel runtime env is used, not a build-time empty secret.
function handler(...args: [Request, unknown]) {
  const nextAuthHandler = NextAuth(getAuthOptions()) as (...handlerArgs: unknown[]) => Response;
  return nextAuthHandler(...args);
}

export { handler as GET, handler as POST };
