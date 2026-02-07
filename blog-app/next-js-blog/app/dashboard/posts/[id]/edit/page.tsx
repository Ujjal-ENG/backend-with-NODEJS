import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { PostForm } from "@/components/dashboard/post-form";
import type { Paginated } from "@/types/api";
import type { Post } from "@/types/entities";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Post" };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  let post: Post | undefined;
  try {
    // Workaround: backend lacks GET /posts/:id for single post
    const result = await apiFetch<Paginated<Post>>(
      `/posts?page=1&limit=100`,
      { tags: ["posts"] },
    );
    post = result.data.find((p) => p.id === Number(id));
  } catch {
    notFound();
  }

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PostForm post={post} />
    </div>
  );
}
