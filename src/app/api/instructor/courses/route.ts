import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Instructors cannot create courses. An admin must assign the class." },
    { status: 403 },
  );
}
