"use client";

import { PostForm } from "@/components/dashboard/post-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Post } from "@/types/entities";
import { Pencil } from "lucide-react";

export function EditPostModal({ post }: { post: Post }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-1 h-3 w-3" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
        <PostForm post={post} />
      </DialogContent>
    </Dialog>
  );
}
