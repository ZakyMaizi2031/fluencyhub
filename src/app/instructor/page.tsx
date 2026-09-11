import { auth } from "@/lib/session";

export default async function InstructorHomePage() {
  const session = await auth();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">Instructor</h1>
      <p className="mt-2 text-sm text-[var(--text-3)]">
        Signed in as {session?.user.email}. Curriculum tools come in a later phase.
      </p>
    </main>
  );
}
