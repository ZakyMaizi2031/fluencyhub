import { EnrollmentBars } from "@/components/instructor/EnrollmentBars";
import {
  getInstructorOverview,
  listInstructorCoursesWithRevenue,
  listInstructorEnrollmentByMonth,
} from "@/lib/db/courses.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";
import { formatIdr } from "@/lib/utils/cn";

export default async function InstructorHomePage() {
  const session = await auth();
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const [stats, courses, months] = await Promise.all([
    getInstructorOverview(scope),
    listInstructorCoursesWithRevenue(scope),
    listInstructorEnrollmentByMonth(scope, 6),
  ]);
  const share = Number(stats.sharePct).toFixed(0);

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-4">
      <div className="grid-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {[
          { lbl: `Revenue (${share}%)`, val: formatIdr(stats.instructorRevenue), bg: "#f0fdf4" },
          { lbl: "Total Enrolled", val: String(stats.enrolledTotal), bg: "#eff6ff" },
          { lbl: "Active Courses", val: String(stats.publishedCount), bg: "#f5f3ff" },
          { lbl: "Revenue Share", val: `${share}%`, bg: "#fefce8" },
        ].map((s) => (
          <div key={s.lbl} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }} />
            <div>
              <p className="stat-val">{s.val}</p>
              <p className="stat-lbl">{s.lbl}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-heading)] text-[15px] font-bold">Monthly Enrollment</h3>
          <span className="badge badge-primary">Last 6 months</span>
        </div>
        <EnrollmentBars points={months} />
      </div>
      <div className="card">
        <h3 className="mb-3 font-[family-name:var(--font-heading)] text-[15px] font-bold">Course Performance</h3>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Revenue (share)</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="max-w-[180px] truncate font-semibold">{c.title}</td>
                  <td>
                    <span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"}`}>{c.status}</span>
                  </td>
                  <td className="font-semibold">{c.enrollmentCount}</td>
                  <td className="font-bold text-[var(--green)]">{Number(c.revenue) > 0 ? formatIdr(c.revenue) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
