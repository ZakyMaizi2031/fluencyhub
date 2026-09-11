import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { auth } from "@/lib/session";

export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect("/auth/staff/complete");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="card">
        <h1 className="mb-2 text-2xl font-extrabold">Staff sign in</h1>
        <p className="mb-6 text-sm text-[var(--text-3)]">
          For instructors and admins only. This page is not linked from the public site.
        </p>
        <GoogleSignInButton
          callbackUrl={params.callbackUrl ?? "/auth/staff/complete"}
          label="Continue with Google"
        />
      </div>
    </main>
  );
}
