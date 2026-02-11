import { NextResponse } from "next/server";
import { getPostCreatorsPresence } from "@/lib/api/presence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const presence = await getPostCreatorsPresence();
    return NextResponse.json(presence);
  } catch (error) {
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
