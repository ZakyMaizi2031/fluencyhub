"use client";

import { AdminDataGrid } from "@/components/admin/AdminDataGrid";

export type AdminGridCell = string | { badge: string; tone?: "success" | "warning" | "danger" | "primary" };

function toneClass(tone?: string) {
  if (tone === "success") return "badge badge-success";
  if (tone === "warning") return "badge badge-warning";
  if (tone === "danger") return "badge badge-danger";
  return "badge badge-primary";
}

export function AdminSimpleGrid({
  columns,
  rows,
  pageSize = 10,
}: {
  columns: string[];
  rows: Array<{ key: string; cells: AdminGridCell[] }>;
  pageSize?: number;
}) {
  return (
    <AdminDataGrid columns={columns} rowCount={rows.length} pageSize={pageSize}>
      {({ start, end }) =>
        rows.slice(start, end).map((row, i) => (
          <tr key={row.key}>
            <td className="text-[var(--text-3)]">{start + i + 1}</td>
            {row.cells.map((cell, idx) => (
              <td key={idx} className={idx === 0 ? "font-semibold" : ""}>
                {typeof cell === "string" ? (
                  cell
                ) : (
                  <span className={toneClass(cell.tone)}>{cell.badge}</span>
                )}
              </td>
            ))}
          </tr>
        ))
      }
    </AdminDataGrid>
  );
}
