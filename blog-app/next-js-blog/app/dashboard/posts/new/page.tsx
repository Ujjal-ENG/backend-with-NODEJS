import type { Metadata } from "next";
import { PostForm } from "@/components/dashboard/post-form";

export const metadata: Metadata = { title: "Create Post" };

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PostForm />
    </div>
  );
}
