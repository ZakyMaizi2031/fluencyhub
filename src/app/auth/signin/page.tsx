import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { auth } from "@/lib/session";

export default async function MemberSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="card">
        <h1 className="heading-md mb-2 text-2xl font-extrabold">Log in Member</h1>
        <p className="mb-6 text-sm text-[var(--text-3)]">
          Masuk dengan Google untuk membeli kelas dan mengakses dashboard.
        </p>
        <GoogleSignInButton callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
