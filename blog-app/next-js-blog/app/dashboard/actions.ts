"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import type {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  Tag,
} from "@/types/entities";
import { PostType, PostStatus } from "@/types/entities";

// === Post Actions ===

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(512),
  postType: z.nativeEnum(PostType),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(256)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  status: z.nativeEnum(PostStatus),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(1000)
    .optional()
    .or(z.literal("")),
  schema: z.string().optional().or(z.literal("")),
  featuredImageUrl: z.string().url().max(1024).optional().or(z.literal("")),
  publishedOn: z.string().optional(),
  tags: z.string().optional(),
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
  const raw = Object.fromEntries(formData);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { tags: tagStr, featuredImageUrl, content, schema, ...rest } =
    parsed.data;
  const payload: CreatePostPayload = {
    ...rest,
    publishedOn: rest.publishedOn || new Date().toISOString(),
    ...(content && content.length >= 10 ? { content } : {}),
    ...(schema ? { schema } : {}),
    ...(featuredImageUrl ? { featuredImageUrl } : {}),
    ...(tagStr
      ? { tags: tagStr.split(",").map(Number).filter(Boolean) }
      : {}),
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
  const raw = Object.fromEntries(formData);
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { tags: tagStr, featuredImageUrl, content, schema, ...rest } =
    parsed.data;
  const payload: UpdatePostPayload = {
    id,
    ...rest,
    ...(content && content.length >= 10 ? { content } : {}),
    ...(schema ? { schema } : {}),
    ...(featuredImageUrl ? { featuredImageUrl } : {}),
    ...(tagStr
      ? { tags: tagStr.split(",").map(Number).filter(Boolean) }
      : {}),
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

export async function deletePostAction(formData: FormData) {
  const id = Number(formData.get("id"));
  await apiFetch<{ deleted: boolean; message: string }>(`/posts/${id}`, {
    method: "DELETE",
  });
  updateTag("posts");
}

// === Tag Actions ===

const tagSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(256),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(512),
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
  const id = Number(formData.get("id"));
  const soft = formData.get("soft") === "true";
  const endpoint = soft ? `/tags/soft-delete/${id}` : `/tags/${id}`;
  await apiFetch(endpoint, { method: "DELETE" });
  updateTag("tags");
}
