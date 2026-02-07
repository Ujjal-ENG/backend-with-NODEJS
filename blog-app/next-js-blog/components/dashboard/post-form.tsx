"use client";

import { useActionState } from "react";
import {
  createPostAction,
  updatePostAction,
  type PostActionState,
} from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Post } from "@/types/entities";
import { PostType, PostStatus } from "@/types/entities";
import { Save } from "lucide-react";

interface PostFormProps {
  post?: Post;
}

export function PostForm({ post }: PostFormProps) {
  const action = post ? updatePostAction : createPostAction;
  const [state, formAction, isPending] = useActionState<
    PostActionState,
    FormData
  >(action, {});

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
            <Label htmlFor="tags">Tag IDs (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={post?.tags?.map((t) => t.id).join(",") || ""}
              placeholder="1,2,3"
            />
            <p className="text-xs text-muted-foreground">
              Enter tag IDs separated by commas
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
