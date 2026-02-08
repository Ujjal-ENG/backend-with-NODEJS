import { PostForm } from "@/components/dashboard/post-form";
import { canCreatePost } from "@/lib/abac";
import { getTags } from "@/lib/api/tags";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create Post" };

export default async function NewPostPage() {
  const session = await getSession();
  const tags = await getTags();

  if (!canCreatePost(session)) {
    redirect("/dashboard/posts?forbidden=true");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PostForm tags={tags} />
    </div>
  );
}
