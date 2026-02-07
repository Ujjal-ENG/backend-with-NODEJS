"use client";

import { useTransition } from "react";
import { deletePostAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeletePostButton({
  postId,
  postTitle,
}: {
  postId: number;
  postTitle: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        if (!confirm(`Are you sure you want to delete "${postTitle}"?`)) return;
        startTransition(() => deletePostAction(formData));
      }}
    >
      <input type="hidden" name="id" value={postId} />
      <Button
        variant="destructive"
        size="sm"
        type="submit"
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
