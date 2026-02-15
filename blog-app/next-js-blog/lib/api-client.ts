import { toApiRequestError } from "@/lib/api-error";
import type { ApiResponse } from "@/types/api";
import { cookies } from "next/headers";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  tags?: string[];
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }
  return {};
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { tags, ...fetchOptions } = options;
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...fetchOptions.headers,
    },
    ...(tags ? { next: { tags } } : {}),
  });

  if (!res.ok) {
    throw await toApiRequestError(
      res,
      `API error: ${res.status} ${res.statusText}`,
    );
  }

  const json: ApiResponse<T> = await res.json();

  return json.data;
}
