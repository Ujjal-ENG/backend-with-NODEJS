import { NextResponse } from "next/server";
import { ApiRequestError } from "@/lib/api-error";
import { getPostCreatorsPresence } from "@/lib/api/presence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const presence = await getPostCreatorsPresence();
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
            : "Failed to load presence list",
      },
      { status: 500 },
    );
  }
}
