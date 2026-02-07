"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTagAction, type TagActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";

export function TagForm() {
  const [state, formAction, isPending] = useActionState<
    TagActionState,
    FormData
  >(createTagAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Tag</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              Tag created successfully!
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Technology"
                required
                minLength={2}
                maxLength={256}
              />
              {state.fieldErrors?.name && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="technology"
                required
                minLength={2}
                maxLength={512}
              />
              {state.fieldErrors?.slug && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.slug[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe this tag (min 10 characters)..."
              rows={3}
            />
            {state.fieldErrors?.description && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagFeaturedImageUrl">
              Featured Image URL (optional)
            </Label>
            <Input
              id="tagFeaturedImageUrl"
              name="featuredImageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              "Creating..."
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
