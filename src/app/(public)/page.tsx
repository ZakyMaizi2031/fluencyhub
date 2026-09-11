import Link from "next/link";
import { listPublishedCourses } from "@/lib/db/courses.queries";
import { formatIdr } from "@/lib/utils/cn";

export default async function LandingPage() {
  const courses = await listPublishedCourses();

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">
          Applied English for STEM
        </p>
        <h1 className="heading-xl max-w-3xl">
          Bahasa Inggris profesional untuk karier sains, teknik, dan bisnis.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-3)]">
          Kelas live + rekaman, pembayaran lokal, akses seumur hidup setelah pembayaran dikonfirmasi.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#harga" className="btn btn-primary btn-lg">Lihat Kelas</a>
          <Link href="/auth/signin" className="btn btn-secondary btn-lg">Log in Member</Link>
        </div>
      </section>

      <section id="masalah" className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-4">
          {[
            "Takut presentasi teknis dalam bahasa Inggris",
            "Meeting internasional terasa berat",
            "Interview HRD multinasional",
            "Menulis laporan yang kurang tajam",
          ].map((item) => (
            <div key={item} className="card">
              <p className="font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="metode" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="heading-lg">Metode</h2>
        <p className="mt-3 max-w-2xl text-[var(--text-3)]">
          Video on-demand + live class Zoom/Google Meet. Materi hanya terbuka setelah enrollment aktif.
        </p>
      </section>

      <section id="harga" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="heading-lg mb-8">Harga</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, i) => (
              <article key={course.id} className="card flex flex-col">
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnailUrl}
                    alt=""
                    className="mb-4 h-36 w-full rounded-[var(--r-md)] object-cover"
                  />
                ) : null}
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold">{course.title}</h3>
                <p className="mt-2 flex-1 text-sm text-[var(--text-3)]">{course.shortDescription}</p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    {course.originalPrice ? (
                      <p className="text-xs text-[var(--text-4)] line-through">
                        {formatIdr(course.originalPrice)}
                      </p>
                    ) : null}
                    <p className="text-xl font-extrabold text-[var(--brand)]">{formatIdr(course.price)}</p>
                  </div>
                  <Link
                    href={`/checkout?courseId=${course.id}`}
                    className={`btn btn-default ${i === 1 ? "btn-primary" : "btn-secondary"}`}
                  >
                    Buy Now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimoni" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="heading-lg mb-6">Testimoni</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "Budi", t: "Presentasi data saya jadi jauh lebih jelas." },
            { n: "Dewi", t: "Meeting dengan klien luar jadi lebih tenang." },
            { n: "Nadia", t: "Lolos interview setelah latihan roleplay." },
          ].map((x) => (
            <div key={x.n} className="card">
              <p className="text-sm text-[var(--text-2)]">“{x.t}”</p>
              <p className="mt-3 text-xs font-bold text-[var(--text-4)]">{x.n}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
