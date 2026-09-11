import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "NotStaff"
      ? "This Google account is not registered as instructor or admin."
      : error === "AccessDenied"
        ? "You do not have access to that area."
        : "Sign-in failed. Please try again.";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4">
      <div className="card">
        <h1 className="mb-2 text-2xl font-extrabold">Authentication error</h1>
        <p className="mb-6 text-sm text-[var(--text-3)]">{message}</p>
        <Link href="/" className="btn btn-primary btn-default">
          Back home
        </Link>
      </div>
    </main>
  );
}
