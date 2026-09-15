import Link from "next/link";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { listPublishedCoursesWithInstructor } from "@/lib/db/courses.queries";
import { auth } from "@/lib/session";
import { LandingIcon } from "@/components/landing/LandingIcon";

export default async function DashboardHomePage() {
  const session = await auth();
  const enrollments = session?.user.id
    ? await listEnrollmentsForUser(Number(session.user.id))
    : [];

  const allCourses = await listPublishedCoursesWithInstructor();

  const stats = [
    { icon: "CheckCircle", bg: "bg-green-50", c: "#16a34a", lbl: "Lesson Selesai", val: "2/12" },
    { icon: "Video", bg: "bg-blue-50", c: "#2563eb", lbl: "Sesi Live", val: "1/8" },
    { icon: "Building2", bg: "bg-yellow-50", c: "#d97706", lbl: "Studio Booking", val: "0/1" },
    { icon: "FileText", bg: "bg-purple-50", c: "#7c3aed", lbl: "Resources", val: "3" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-700)] p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h2 className="mb-1 font-[family-name:var(--font-heading)] text-2xl font-extrabold md:text-3xl">
            Welcome back, {session?.user.name}! 👋
          </h2>
          <p className="mb-6 text-sm text-white/80">
            Anda di <strong className="text-yellow-200">Modul 1: Minggu ke-1</strong>. Terus semangat!
          </p>
          <div className="inline-block rounded-xl bg-black/20 p-4">
            <div className="mb-2 flex justify-between text-xs font-semibold text-white/90">
              <span>Modul 1 Progress</span>
              <span>25%</span>
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-white/20 md:w-64">
              <div className="h-full w-1/4 bg-yellow-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, idx) => (
          <div key={idx} className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
              <LandingIcon name={s.icon} color={s.c} />
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-900">{s.val}</div>
              <div className="text-xs font-medium text-zinc-500">{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* Lanjutkan Belajar */}
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-zinc-900">Lanjutkan Belajar</h3>
            <button className="flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-[var(--brand)]">
              Lihat Semua <LandingIcon name="ArrowRight" color="currentColor" />
            </button>
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=70" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" alt="Thumbnail" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur-md">
                  <LandingIcon name="Play" color="#fff" />
                </div>
              </div>
            </div>
            <div>
              <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                Modul 1 • Lesson 1
              </span>
              <h4 className="mb-1 font-[family-name:var(--font-heading)] text-base font-bold text-zinc-900">
                The Architecture of a Pitch
              </h4>
              <p className="text-sm text-zinc-500">Teknik Rule of Three untuk presentasi C-Level.</p>
            </div>
          </div>
        </div>

        {/* Live Mendatang */}
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Live Mendatang</span>
          </div>
          <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-zinc-100">
            <div className="text-center px-2">
              <div className="text-sm font-bold text-zinc-900">18</div>
              <div className="text-xs font-semibold text-zinc-500">AUG</div>
            </div>
            <div className="h-8 w-px bg-zinc-100" />
            <div className="flex-1 px-3">
              <div className="text-xs font-semibold text-blue-600">19:00 WIB</div>
              <div className="truncate text-sm font-bold text-zinc-900">Roleplay: Dashboard Briefing</div>
            </div>
          </div>
          <button className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            Gabung Sesi Live
          </button>
        </div>
      </div>

      {/* Kelas Saya */}
      {enrollments.length > 0 && (
        <>
          <hr className="border-zinc-100 my-4" />
          <div>
            <h2 className="mb-4 text-xl font-extrabold text-zinc-900">Kelas Saya</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {enrollments.map((e) => (
                <Link key={e.id} href={`/dashboard/courses/${e.courseId}`} className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md">
                  <div className="relative h-32 w-full bg-zinc-100">
                    {e.course.thumbnailUrl ? (
                      <img src={e.course.thumbnailUrl} alt={e.course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-zinc-200">
                        <LandingIcon name="Video" color="#9ca3af" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md">
                      {e.progressPct}% Selesai
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-zinc-900 line-clamp-2">{e.course.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Semua Kelas */}
      <hr className="border-zinc-100 my-4" />
      <div>
        <h2 className="mb-4 text-xl font-extrabold text-zinc-900">Jelajahi Kelas Lainnya</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {allCourses.map((c) => (
            <Link key={c.id} href={`/courses/${c.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md">
              <div className="relative h-32 w-full bg-zinc-100">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-200">
                    <LandingIcon name="BookOpen" color="#9ca3af" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h4 className="mb-1 font-bold text-zinc-900 line-clamp-2">{c.title}</h4>
                  <p className="mb-3 text-xs text-zinc-500 line-clamp-2">{c.shortDescription}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-600">{c.instructorName}</span>
                  <span className="text-sm font-bold text-[var(--brand)]">
                    {c.isFree ? "Gratis" : `Rp ${Number(c.price).toLocaleString("id-ID")}`}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <hr className="border-zinc-100 my-4" />

    </main>
  );
}
