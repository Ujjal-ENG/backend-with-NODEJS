"use client";

import { useTransition } from "react";
import { deleteTagAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteTagButton({
  tagId,
  tagName,
  soft = false,
}: {
  tagId: number;
  tagName: string;
  soft?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        if (!confirm(`Are you sure you want to delete tag "${tagName}"?`))
          return;
        startTransition(() => deleteTagAction(formData));
      }}
    >
      <input type="hidden" name="id" value={tagId} />
      <input type="hidden" name="soft" value={soft.toString()} />
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
