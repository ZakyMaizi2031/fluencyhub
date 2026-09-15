import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminPath = `/${process.env.ADMIN_PATH ?? "fh-admin"}`;
  const token = await getToken({
    req,
    secret: (process.env["NEXTAUTH_SECRET"] || process.env["AUTH_SECRET"] || "").trim(),
  });

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const url = new URL("/auth/signin", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/instructor")) {
    if (!token) {
      const url = new URL("/auth/staff", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "instructor" && token.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/error?error=AccessDenied", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith(adminPath)) {
    if (!token) {
      const url = new URL("/auth/staff", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/error?error=AccessDenied", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Keep ADMIN_PATH in sync (default fh-admin). Extra path is harmless if unused.
  matcher: ["/dashboard/:path*", "/instructor/:path*", "/fh-admin/:path*", "/admin/:path*"],
};
