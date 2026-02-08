"use client";

import {
  createPostAction,
  updatePostAction,
  type PostActionState,
} from "@/app/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Post, Tag } from "@/types/entities";
import { PostStatus, PostType } from "@/types/entities";
import { Save, X } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

interface PostFormProps {
  post?: Post;
  tags?: Tag[];
}

export function PostForm({ post, tags }: PostFormProps) {
  const action = post ? updatePostAction : createPostAction;
  const [state, formAction, isPending] = useActionState<
    PostActionState,
    FormData
  >(action, {});
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(() =>
    Array.from(new Set((post?.tags ?? []).map((tag) => tag.id))),
  );
  const [tagSelectKey, setTagSelectKey] = useState(0);

  const selectedTagLabels = useMemo(() => {
    const tagMap = new Map(
      (tags ? tags : (post?.tags ?? [])).map((tag) => [tag.id, tag.name]),
    );

    return selectedTagIds.map((tagId) => ({
      id: tagId,
      name: tagMap.get(tagId) ?? `Tag #${tagId}`,
    }));
  }, [selectedTagIds, tags, post?.tags]);

  const availableTags = useMemo(
    () =>
      (tags ? tags : (post?.tags ?? [])).filter(
        (tag) => !selectedTagIds.includes(tag.id),
      ),
    [selectedTagIds, tags, post?.tags],
  );

  const addTag = (tagIdString: string) => {
    const tagId = Number(tagIdString);
    if (!Number.isFinite(tagId) || tagId <= 0) {
      return;
    }

    setSelectedTagIds((current) =>
      current.includes(tagId) ? current : [...current, tagId],
    );
    setTagSelectKey((current) => current + 1);
  };

  const removeTag = (tagId: number) => {
    setSelectedTagIds((current) => current.filter((id) => id !== tagId));
  };

  console.log(selectedTagLabels);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post ? "Edit Post" : "Create New Post"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {post && <input type="hidden" name="id" value={post.id} />}

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={post?.title}
              placeholder="Enter post title"
              required
              minLength={3}
              maxLength={512}
            />
            {state.fieldErrors?.title && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.title[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={post?.slug}
              placeholder="my-post-slug"
              required
              pattern="^[a-z0-9-]+$"
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (lowercase letters, numbers, hyphens)
            </p>
            {state.fieldErrors?.slug && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.slug[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postType">Post Type</Label>
              <Select
                name="postType"
                defaultValue={post?.postType || PostType.POST}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PostType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                defaultValue={post?.status || PostStatus.DRAFT}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PostStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              defaultValue={post?.content || ""}
              placeholder="Write your post content here (min 10 characters)..."
              rows={12}
              className="resize-y"
            />
            {state.fieldErrors?.content && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.content[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="featuredImageUrl">Featured Image URL</Label>
            <Input
              id="featuredImageUrl"
              name="featuredImageUrl"
              type="url"
              defaultValue={post?.featuredImageUrl || ""}
              placeholder="https://example.com/image.jpg"
            />
            {state.fieldErrors?.featuredImageUrl && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.featuredImageUrl[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-selector">Tags</Label>
            {selectedTagIds.map((tagId) => (
              <input key={tagId} type="hidden" name="tags" value={tagId} />
            ))}

            <Select
              key={tagSelectKey}
              onValueChange={addTag}
              disabled={availableTags.length === 0}
            >
              <SelectTrigger id="tag-selector">
                <SelectValue
                  placeholder={
                    availableTags.length > 0
                      ? "Select tag to add"
                      : "No more tags available"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableTags.map((tag) => (
                  <SelectItem key={tag.id} value={String(tag.id)}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {selectedTagLabels.length > 0 ? (
                selectedTagLabels.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted"
                      aria-label={`Remove ${tag.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No tags selected
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Add tags from dropdown. Only selected tag IDs are submitted.
            </p>
          </div>

          <input
            type="hidden"
            name="publishedOn"
            value={post?.publishedOn || new Date().toISOString()}
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {post ? "Update Post" : "Create Post"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
