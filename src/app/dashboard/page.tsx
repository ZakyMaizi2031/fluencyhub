import Link from "next/link";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { auth } from "@/lib/session";

export default async function DashboardHomePage() {
  const session = await auth();
  const enrollments = session?.user.id
    ? await listEnrollmentsForUser(Number(session.user.id))
    : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold">Halo, {session?.user.name}</h1>
      {enrollments.length === 0 ? (
        <div className="card">
          <p className="mb-3 text-sm text-[var(--text-3)]">Belum ada kelas. Pilih kelas di beranda.</p>
          <Link href="/" className="btn btn-primary btn-default">Lihat kelas</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((e) => (
            <Link key={e.id} href={`/dashboard/courses/${e.courseId}`} className="card block">
              <p className="font-bold">{e.course.title}</p>
              <p className="text-sm text-[var(--text-3)]">Progress {e.progressPct}%</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
