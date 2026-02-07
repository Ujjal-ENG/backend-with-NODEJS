import { apiFetch } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { Post } from "@/types/entities";

export async function getPosts(page = 1, limit = 10) {
  return apiFetch<Paginated<Post>>(`/posts?page=${page}&limit=${limit}`, {
    tags: ["posts"],
  });
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  // Workaround: backend lacks a GET /posts/by-slug/:slug endpoint
  const result = await apiFetch<Paginated<Post>>(`/posts?page=1&limit=100`, {
    tags: ["posts", `post-${slug}`],
  });
  return result.data.find((p) => p.slug === slug) ?? null;
}

export async function getPostsByUser(userId: number) {
  return apiFetch<Post[]>(`/posts/${userId}`, {
    tags: ["posts", `user-posts-${userId}`],
  });
}
