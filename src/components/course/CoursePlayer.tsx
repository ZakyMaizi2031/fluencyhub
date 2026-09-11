import Link from "next/link";
import type { PlayerLesson, PlayerSection } from "@/lib/db/lessons.queries";

function typeLabel(type: string) {
  if (type === "live_class") return "Live";
  if (type === "document") return "Dokumen";
  if (type === "text") return "Teks";
  return "Video";
}

export function CoursePlayer({
  courseId,
  courseTitle,
  current,
  sections,
  prevId,
  nextId,
  preview,
  liveJoinUrl,
  backHref,
}: {
  courseId: number;
  courseTitle: string;
  current: PlayerLesson;
  sections: PlayerSection[];
  prevId: number | null;
  nextId: number | null;
  preview: boolean;
  liveJoinUrl: string | null;
  backHref: string;
}) {
  const total = sections.reduce((n, s) => n + s.lessons.length, 0);
  const index = sections.flatMap((s) => s.lessons).findIndex((l) => l.id === current.id);
  const pct = total ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div className="player-shell">
      <div className="player-top">
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-heading)] text-sm font-extrabold">{courseTitle}</p>
          {preview ? <span className="badge badge-inst">Preview mode</span> : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text-3)]">
            {index + 1}/{total} · {pct}%
          </span>
          <Link href={backHref} className="btn btn-ghost btn-sm" aria-label="Close">
            ✕
          </Link>
        </div>
      </div>
      <div className="player-grid">
        <div className="player-main">
          <p className="mb-3 font-[family-name:var(--font-heading)] text-lg font-extrabold">{current.title}</p>
          {current.contentType === "youtube_video" && current.youtubeVideoId ? (
            <iframe
              className="aspect-video w-full rounded-[var(--r-lg)] bg-black"
              src={`https://www.youtube-nocookie.com/embed/${current.youtubeVideoId}`}
              title={current.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : null}
          {current.contentType === "youtube_video" && !current.youtubeVideoId ? (
            <div className="flex aspect-video items-center justify-center rounded-[var(--r-lg)] bg-[#09090b] text-sm text-zinc-400">
              No YouTube URL on this lesson yet.
            </div>
          ) : null}
          {current.contentType === "live_class" ? (
            <div className="card">
              {liveJoinUrl ? (
                <a href={liveJoinUrl} className="btn btn-primary btn-default" target="_blank" rel="noreferrer">
                  Join live class
                </a>
              ) : (
                <p className="text-sm text-[var(--text-3)]">Join link unlocks 30 minutes before class start.</p>
              )}
            </div>
          ) : null}
          {current.contentType === "document" && current.documentUrl ? (
            <a href={current.documentUrl} className="btn btn-primary btn-default" target="_blank" rel="noreferrer">
              Open document
            </a>
          ) : null}
          {current.contentType === "text" && current.textContent ? (
            <div className="card whitespace-pre-wrap text-sm">{current.textContent}</div>
          ) : null}
          {current.description ? <p className="mt-4 text-sm text-[var(--text-2)]">{current.description}</p> : null}
          <div className="player-nav">
            {prevId ? (
              <Link href={`/dashboard/courses/${courseId}/${prevId}`} className="btn btn-secondary btn-default">
                ← Pelajaran sebelumnya
              </Link>
            ) : (
              <span />
            )}
            {nextId ? (
              <Link href={`/dashboard/courses/${courseId}/${nextId}`} className="btn btn-primary btn-default">
                Pelajaran selanjutnya →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
        <aside className="player-aside">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold">Daftar Materi</h3>
          </div>
          {sections.map((sec) => (
            <div key={sec.id} className="mb-4">
              <p className="mb-2 text-xs font-bold text-[var(--text-3)]">{sec.title}</p>
              {sec.lessons.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/courses/${courseId}/${l.id}`}
                  className={`player-item${l.id === current.id ? " active" : ""}`}
                >
                  <span className="player-radio" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{l.title}</span>
                    <span className="text-[10px] text-[var(--text-4)]">
                      {typeLabel(l.contentType)}
                      {l.durationMinutes ? ` · ${l.durationMinutes} min` : ""}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
