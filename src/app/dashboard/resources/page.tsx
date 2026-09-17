import { LandingIcon } from "@/components/landing/LandingIcon";
import { auth } from "@/lib/session";
import { listUserResources } from "@/lib/db/resources.queries";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ResourcesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = Number(session.user.id);
  const resources = await listUserResources(userId);

  // Helper to determine icon & colors based on document URL / type
  const getResourceMeta = (url: string | null) => {
    const isPdf = url?.toLowerCase().endsWith(".pdf");
    const isDoc = url?.toLowerCase().match(/\.(doc|docx)$/);
    const isXls = url?.toLowerCase().match(/\.(xls|xlsx|csv)$/);
    
    if (isPdf) {
      return { icon: "FileText", bg: "bg-red-50", color: "#dc2626" }; // red
    }
    if (isDoc) {
      return { icon: "FileCheck", bg: "bg-green-50", color: "#16a34a" }; // green
    }
    if (isXls) {
      return { icon: "Layers", bg: "bg-green-50", color: "#16a34a" }; // green
    }
    // Default / general
    return { icon: "Layers", bg: "bg-blue-50", color: "#2563eb" }; // blue
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 border-b border-zinc-200 pb-4">
        <h1 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-extrabold text-zinc-900 md:text-2xl">
          Resource Library
        </h1>
        <p className="text-xs text-zinc-500 md:text-sm">
          Unduh PDF, silabus, dan template penting dari semua kelas Anda.
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <LandingIcon name="BookOpen" color="currentColor" />
          </div>
          <h3 className="mb-2 font-[family-name:var(--font-heading)] text-lg font-bold text-zinc-900">
            Belum Ada Resource
          </h3>
          <p className="max-w-sm text-sm text-zinc-500">
            Anda belum memiliki materi atau modul latihan karena Anda belum terdaftar di kelas manapun yang memiliki dokumen tambahan.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => {
            const meta = getResourceMeta(res.documentUrl);
            return (
              <div 
                key={res.id} 
                className="group flex flex-col rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:border-zinc-200 hover:shadow-md"
              >
                <div className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                  <LandingIcon name={meta.icon} color={meta.color} />
                </div>
                
                <h3 className="mb-1 font-[family-name:var(--font-heading)] text-sm font-bold text-zinc-900 leading-snug">
                  {res.title}
                </h3>
                <p className="mb-4 flex-1 text-xs text-zinc-500 leading-relaxed line-clamp-3">
                  {res.description || res.courseTitle}
                </p>
                
                {res.documentUrl ? (
                  <a
                    href={res.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                  >
                    <LandingIcon name="Download" color="currentColor" />
                    Download
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-sm font-semibold text-zinc-400"
                  >
                    Kosong
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
