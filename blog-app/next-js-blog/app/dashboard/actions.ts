"use server";

import {
  canCreatePost,
  canDeletePost,
  canEditPost,
  canManageTags,
} from "@/lib/abac";
import { apiFetch } from "@/lib/api-client";
import { getSession } from "@/lib/auth";
import type {
  CreatePostPayload,
  Post,
  Tag,
  UpdatePostPayload,
} from "@/types/entities";
import { PostStatus, PostType } from "@/types/entities";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// === Post Actions ===

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(512),
  postType: z.nativeEnum(PostType),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(256)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    ),
  status: z.nativeEnum(PostStatus),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .optional()
    .or(z.literal("")),
  schema: z.string().optional().or(z.literal("")),
  featuredImageUrl: z.string().url().max(1024).optional().or(z.literal("")),
  publishedOn: z.string().optional(),
});

export type PostActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function createPostAction(
  prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const session = await getSession();
  if (!canCreatePost(session)) {
    return { error: "You are not allowed to create posts" };
  }

  const raw = Object.fromEntries(
    Array.from(formData.entries()).filter(([key]) => key !== "tags"),
  );
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const selectedTagIds = formData
    .getAll("tags")
    .map((tagId) => Number(tagId))
    .filter((tagId) => Number.isFinite(tagId) && tagId > 0);

  const { featuredImageUrl, content, schema, ...rest } = parsed.data;
  const payload: CreatePostPayload = {
    ...rest,
    publishedOn: rest.publishedOn || new Date().toISOString(),
    ...(content && content.length >= 10 ? { content } : {}),
    ...(schema ? { schema } : {}),
    ...(featuredImageUrl ? { featuredImageUrl } : {}),
    ...(selectedTagIds.length > 0 ? { tags: selectedTagIds } : {}),
  };

  try {
    await apiFetch<Post>("/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    updateTag("posts");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create post" };
  }

  redirect("/dashboard/posts");
}

export async function updatePostAction(
  prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const id = Number(formData.get("id"));
  const session = await getSession();
  if (!session) {
    return { error: "You are not authenticated" };
  }

  if (!Number.isFinite(id) || id <= 0) {
    return { error: "Invalid post id" };
  }

  let post: Post;
  try {
    post = await apiFetch<Post>(`/posts/${id}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load post" };
  }

  if (!canEditPost(session, post)) {
    return { error: "You are not allowed to update this post" };
  }

  const raw = Object.fromEntries(
    Array.from(formData.entries()).filter(([key]) => key !== "tags"),
  );
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const selectedTagIds = formData
    .getAll("tags")
    .map((tagId) => Number(tagId))
    .filter((tagId) => Number.isFinite(tagId) && tagId > 0);

  const { featuredImageUrl, content, schema, ...rest } = parsed.data;
  const payload: UpdatePostPayload = {
    ...rest,
    ...(content && content.length >= 10 ? { content } : {}),
    ...(schema ? { schema } : {}),
    ...(featuredImageUrl ? { featuredImageUrl } : {}),
    ...(selectedTagIds.length > 0 ? { tags: selectedTagIds } : {}),
  };

  try {
    await apiFetch<Post>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    updateTag("posts");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update post" };
  }

  redirect("/dashboard/posts");
}

/**
 * Lightweight PATCH that only updates the `content` field of an existing post.
 * Called automatically while the user is editing so that image URLs embedded
 * by CKEditor are persisted as soon as the upload resolves — without waiting
 * for the full form to be submitted.
 */
export async function autosavePostAction(
  id: number,
  content: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };
  if (!Number.isFinite(id) || id <= 0) return { error: "Invalid post id" };

  let post: Post;
  try {
    post = await apiFetch<Post>(`/posts/${id}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load post" };
  }

  if (!canEditPost(session, post)) return { error: "Not allowed" };

  try {
    await apiFetch<Post>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
    updateTag("posts");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to autosave" };
  }
}

export async function deletePostAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const session = await getSession();
  if (!session) {
    throw new Error("You are not authenticated");
  }
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid post id");
  }

  const post = await apiFetch<Post>(`/posts/${id}`);
  if (!canDeletePost(session, post)) {
    throw new Error("You are not allowed to delete this post");
  }

  await apiFetch<{ deleted: boolean; message: string }>(`/posts/${id}`, {
    method: "DELETE",
  });
  updateTag("posts");
}

// === Tag Actions ===

const tagSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(256),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(512),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500)
    .optional()
    .or(z.literal("")),
  schema: z.string().optional().or(z.literal("")),
  featuredImageUrl: z.string().url().max(1024).optional().or(z.literal("")),
});

export type TagActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function createTagAction(
  prevState: TagActionState,
  formData: FormData,
): Promise<TagActionState> {
  const session = await getSession();
  if (!canManageTags(session)) {
    return { error: "You are not allowed to manage tags" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = tagSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { description, schema, featuredImageUrl, ...rest } = parsed.data;
  const payload = {
    ...rest,
    ...(description && description.length >= 10 ? { description } : {}),
    ...(schema ? { schema } : {}),
    ...(featuredImageUrl ? { featuredImageUrl } : {}),
  };

  try {
    await apiFetch<Tag>("/tags", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    updateTag("tags");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create tag" };
  }
}

export async function deleteTagAction(formData: FormData) {
  const session = await getSession();
  if (!canManageTags(session)) {
    throw new Error("You are not allowed to manage tags");
  }

  const id = Number(formData.get("id"));
  const soft = formData.get("soft") === "true";
  const endpoint = soft ? `/tags/soft-delete/${id}` : `/tags/${id}`;
  await apiFetch(endpoint, { method: "DELETE" });
  updateTag("tags");
}
