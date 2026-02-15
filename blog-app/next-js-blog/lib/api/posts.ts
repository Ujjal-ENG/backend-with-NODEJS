import { apiFetch } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { Post } from "@/types/entities";

interface GetPostsOptions {
  search?: string;
}

export async function getPosts(
  page = 1,
  limit = 10,
  options: GetPostsOptions = {},
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  return apiFetch<Paginated<Post>>(`/posts?${params.toString()}`, {
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

export async function getPostById(id: number): Promise<Post> {
  return apiFetch<Post>(`/posts/${id}`, {
    tags: ["posts", `post-${id}`],
  });
}

export async function getPostsByUser(userId: number) {
  return apiFetch<Post[]>(`/posts/user/${userId}`, {
    tags: ["posts", `user-posts-${userId}`],
  });
}
