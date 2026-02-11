import { NextResponse } from "next/server";
import { markPresenceOnline } from "@/lib/api/presence";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const presence = await markPresenceOnline();
    return NextResponse.json(presence);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update online presence",
      },
      { status: 500 },
    );
  }
}
