import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, RagDraftRequest, RagDraftResponse } from "@/types/api";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<RagDraftRequest>;
  try {
    body = (await request.json()) as Partial<RagDraftRequest>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const topic = body.topic?.trim() || "";
  if (topic.length < 5) {
    return NextResponse.json(
      { message: "Topic must be at least 5 characters" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/rag/draft`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        ...body,
        topic,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        `Failed to generate draft (${response.status})`;
      return NextResponse.json({ message }, { status: response.status });
    }

    const envelope = payload as ApiResponse<RagDraftResponse>;
    return NextResponse.json(envelope.data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unexpected draft error",
      },
      { status: 500 },
    );
  }
}
