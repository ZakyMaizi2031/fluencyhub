import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function auth() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "NO_SECRET") {
      console.error("NEXTAUTH_SECRET or AUTH_SECRET is missing in this environment");
      return null;
    }
    throw error;
  }
}
