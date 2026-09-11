import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "instructor" | "admin";
      name?: string | null;
      email?: string | null;
      image?: string | null;
      revenueSharePct?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "user" | "instructor" | "admin";
    revenueSharePct?: string;
    roleCheckedAt?: number;
  }
}
