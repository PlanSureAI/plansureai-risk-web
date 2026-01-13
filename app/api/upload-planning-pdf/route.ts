import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Use /api/documents/upload instead.",
      migration: "The synchronous upload endpoint has been replaced with an async pipeline.",
      newEndpoint: "/api/documents/upload",
    },
    { status: 410 }
  );
}
