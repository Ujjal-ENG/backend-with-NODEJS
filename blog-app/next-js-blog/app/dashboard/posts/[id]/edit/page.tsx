import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canEditPost } from "@/lib/abac";
import { getPostById } from "@/lib/api/posts";
import { getTags } from "@/lib/api/tags";
import { PostForm } from "@/components/dashboard/post-form";
import type { Post, Tag } from "@/types/entities";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Post" };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  let post: Post;
  let tags: Tag[] = [];
  try {
    [post, tags] = await Promise.all([getPostById(Number(id)), getTags()]);
  } catch {
    notFound();
  }

  if (!canEditPost(session, post)) {
    redirect("/dashboard/posts?forbidden=true");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PostForm post={post} tags={tags} />
    </div>
  );
}
