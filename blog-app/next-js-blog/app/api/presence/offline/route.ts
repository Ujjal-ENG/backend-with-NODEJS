import { NextResponse } from "next/server";
import { markPresenceOffline } from "@/lib/api/presence";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const presence = await markPresenceOffline();
    return NextResponse.json(presence);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update offline presence",
      },
      { status: 500 },
    );
  }
}
