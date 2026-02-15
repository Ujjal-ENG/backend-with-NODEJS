import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

interface BackendPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  publishedOn: string;
}

interface SuggestionItem {
  id: number;
  title: string;
  slug: string;
  snippet: string;
  publishedOn: string;
}

interface BackendPaginated<T> {
  data: T[];
}

interface BackendEnvelope<T> {
  data: T;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") || 6);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 10)
    : 6;

  if (query.length < 2) {
    return NextResponse.json<SuggestionItem[]>([]);
  }

  const params = new URLSearchParams({
    page: "1",
    limit: String(limit),
    search: query,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/posts?${params.toString()}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to fetch suggestions (${response.status})` },
        { status: response.status },
      );
    }

    const payload = (await response.json()) as BackendEnvelope<
      BackendPaginated<BackendPost>
    >;
    const posts = payload?.data?.data ?? [];

    const suggestions: SuggestionItem[] = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      snippet: (post.content || "").replace(/\s+/g, " ").trim().slice(0, 120),
      publishedOn: post.publishedOn,
    }));

    return NextResponse.json(suggestions, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unexpected error fetching suggestions",
      },
      { status: 500 },
    );
  }
}
