import { NextResponse } from "next/server";
import { ApiRequestError } from "@/lib/api-error";
import { markPresenceOnline } from "@/lib/api/presence";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const presence = await markPresenceOnline();
    return NextResponse.json(presence);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: error.status,
          headers:
            typeof error.retryAfterSeconds === "number"
              ? { "Retry-After": String(error.retryAfterSeconds) }
              : undefined,
        },
      );
    }

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
