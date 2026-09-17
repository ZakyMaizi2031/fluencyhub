import { LandingIcon } from "@/components/landing/LandingIcon";
import { auth } from "@/lib/session";
import { listUpcomingLiveClasses } from "@/lib/db/lessons.queries";

export default async function LivePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6 md:p-10 text-center">
        <h1 className="text-2xl font-bold">Harap login terlebih dahulu</h1>
      </main>
    );
  }

  const liveClasses = await listUpcomingLiveClasses(Number(session.user.id));
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDayLabel = (d: Date | null) => {
    if (!d) return "TBA";
    if (d.toDateString() === now.toDateString()) return "HARI INI";
    if (d.toDateString() === tomorrow.toDateString()) return "BESOK";
    // Returns like "18 AGS"
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }).toUpperCase().replace(".", "");
  };

  const formatTime = (d: Date | null) => {
    if (!d) return "--:--";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
  };

  return (
    <main className="mx-auto w-full max-w-4xl p-6 md:p-10">
      <div className="mb-10 mt-4 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
          Live Mentoring
        </h1>
        <p className="mt-1 text-zinc-500">Jadwal praktik mingguan via Zoom.</p>
      </div>

      <div className="flex flex-col gap-4">
        {liveClasses.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
            <LandingIcon name="Video" size={48} className="mx-auto mb-4 text-zinc-300" color="currentColor" />
            <h3 className="text-lg font-bold text-zinc-900">Belum ada jadwal Live Mentoring</h3>
            <p className="text-zinc-500">Jadwal kelas interaktif akan muncul di sini.</p>
          </div>
        ) : (
          liveClasses.map((session) => {
            // Consider active if it's happening today, or within some timeframe.
            // For now, if the date is today or it's in the past but not more than 2 hours.
            const sessionTime = session.liveClassDatetime ? session.liveClassDatetime.getTime() : 0;
            const isToday = session.liveClassDatetime?.toDateString() === now.toDateString();
            // simple active logic: today, or within next 2 hours
            const isActive = isToday || (sessionTime - now.getTime() < 2 * 60 * 60 * 1000 && sessionTime > now.getTime());

            return (
              <div
                key={session.id}
                className={`relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl border bg-white p-6 transition-all md:flex-row ${
                  isActive ? "border-blue-200 shadow-sm" : "border-zinc-200"
                }`}
              >
                {isActive && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500" />
                )}
                <div className="flex min-w-[80px] flex-col items-center justify-center">
                  <span
                    className={`mb-1 text-xs font-bold uppercase tracking-wider ${
                      isActive ? "text-blue-500" : "text-zinc-400"
                    }`}
                  >
                    {formatDayLabel(session.liveClassDatetime)}
                  </span>
                  <span className="text-2xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
                    {formatTime(session.liveClassDatetime)}
                  </span>
                  <span className="text-xs font-medium text-zinc-400">
                    WIB
                  </span>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    {session.moduleName}
                  </span>
                  <h3 className="mb-2 text-lg font-bold text-zinc-900">
                    {session.title}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 md:justify-start">
                    <img
                      src={session.coachAvatar}
                      alt={session.coachName}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span>Coach: {session.coachName}</span>
                  </div>
                </div>

                <div className="mt-4 min-w-[120px] md:mt-0 md:text-right">
                  {isActive ? (
                    <a
                      href={session.liveClassUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 md:w-auto"
                    >
                      <LandingIcon name="Video" size={16} color="currentColor" />
                      Join Room
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-400">
                      <LandingIcon name="Clock" size={16} color="currentColor" />
                      Menunggu
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
