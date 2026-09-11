"use client";

import { useRouter } from "next/navigation";

export function CoursePicker({
  courses,
  selectedId,
  hrefTemplate,
}: {
  courses: Array<{ id: number; title: string }>;
  selectedId: number;
  hrefTemplate: string;
}) {
  const router = useRouter();
  return (
    <select
      className="input w-auto min-w-56"
      value={selectedId}
      onChange={(e) => router.push(hrefTemplate.replace("{id}", e.target.value))}
    >
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </select>
  );
}
