import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Newsletter subscription endpoint is ready." },
    { status: 501 },
  );
}
