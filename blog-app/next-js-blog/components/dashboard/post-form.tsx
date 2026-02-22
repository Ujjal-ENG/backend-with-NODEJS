"use client";

import {
  autosavePostAction,
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
import type { RagDraftResponse } from "@/types/api";
import type { Post, Tag } from "@/types/entities";
import { PostStatus, PostType } from "@/types/entities";
import { Save, Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const Editor = dynamic(
  () => import("@/components/editor/ckeditor").then((m) => m.CustomCKEditor),
  {
    ssr: false,
    loading: () => <p className="text-muted-foreground">Loading editor...</p>,
  },
);

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
  const [titleValue, setTitleValue] = useState(post?.title ?? "");

  // contentValue drives the Editor's `data` prop (needed for AI-draft injection).
  // The hidden input is UNCONTROLLED and updated via contentInputRef so that
  // the DOM value is always in sync with the editor regardless of React's
  // async batching scheduler.
  const [contentValue, setContentValue] = useState(post?.content ?? "");
  const contentInputRef = useRef<HTMLInputElement>(null);

  // Holds the live CKEditor instance so we can call getData() at any time.
  const editorRef = useRef<any>(null);

  // Autosave debounce timer (only used when editing an existing post).
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState<string | null>(null);

  // Track active CKEditor image uploads so we can block form submission.
  // ckeditor.tsx dispatches "ckeditor:upload:start" / "ckeditor:upload:end".
  const [activeUploads, setActiveUploads] = useState(0);

  const [aiTopic, setAiTopic] = useState(post?.title ?? "");
  const [aiTone, setAiTone] = useState("practical and clear");
  const [aiAudience, setAiAudience] = useState("বাংলা ব্লগ পাঠক");
  const [aiKeywords, setAiKeywords] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReviewNotes, setAiReviewNotes] = useState<string[]>([]);
  const [aiSourcesUsed, setAiSourcesUsed] = useState<number>(0);

  // Listen for upload lifecycle events emitted by MinioUploadAdapter.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStart = () => setActiveUploads((c) => c + 1);
    const onEnd = () => setActiveUploads((c) => Math.max(0, c - 1));

    window.addEventListener("ckeditor:upload:start", onStart);
    window.addEventListener("ckeditor:upload:end", onEnd);

    return () => {
      window.removeEventListener("ckeditor:upload:start", onStart);
      window.removeEventListener("ckeditor:upload:end", onEnd);
    };
  }, []);

  // Cleanup autosave timer on unmount.
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

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
    if (!Number.isFinite(tagId) || tagId <= 0) return;
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current : [...current, tagId],
    );
    setTagSelectKey((current) => current + 1);
  };

  const removeTag = (tagId: number) => {
    setSelectedTagIds((current) => current.filter((id) => id !== tagId));
  };

  const parseKeywords = (value: string): string[] =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);

  /**
   * Sync helper: update the hidden input's DOM value immediately (synchronous,
   * bypasses React's batched state scheduler) AND update the React state so
   * the Editor's `data` prop also reflects the latest content.
   */
  const syncContent = useCallback((data: string) => {
    if (contentInputRef.current) {
      contentInputRef.current.value = data;
    }
    setContentValue(data);
  }, []);

  /**
   * Called on every editor change.
   * 1. Immediately writes to the uncontrolled hidden input (no batching delay).
   * 2. Schedules a debounced autosave PATCH for existing posts.
   */
  const handleEditorChange = useCallback(
    (data: string) => {
      syncContent(data);

      if (!post?.id) return;

      setAutosaveError(null);
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(async () => {
        setIsAutosaving(true);
        const result = await autosavePostAction(post.id, data);
        setIsAutosaving(false);
        if (result.error) setAutosaveError(result.error);
      }, 2000);
    },
    [post?.id, syncContent],
  );

  const handleGenerateDraft = async () => {
    if (isGeneratingAi) return;

    const topic = aiTopic.trim() || titleValue.trim();
    if (topic.length < 5) {
      setAiError("Topic কমপক্ষে ৫ অক্ষরের হতে হবে");
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch("/api/posts/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone: aiTone.trim() || undefined,
          audience: aiAudience.trim() || undefined,
          language: "Bangla",
          length:
            contentValue.trim().length > 1800
              ? "long"
              : contentValue.trim().length > 600
                ? "medium"
                : "short",
          existingDraft: contentValue.trim() || undefined,
          focusKeywords: parseKeywords(aiKeywords),
          preferredTagNames: selectedTagLabels.map((tag) => tag.name),
        }),
      });

      const payload = (await response.json()) as
        | RagDraftResponse
        | { message?: string };

      if (!response.ok) {
        setAiError(
          "message" in payload && payload.message
            ? payload.message
            : "Draft generate করতে সমস্যা হয়েছে",
        );
        return;
      }

      const generated = payload as RagDraftResponse;
      setTitleValue(generated.title);
      setAiTopic(generated.title);
      setAiReviewNotes(generated.reviewNotes ?? []);
      setAiSourcesUsed(generated.retrievedSources?.length ?? 0);
      // Use syncContent so the hidden input and the editor both get the new draft.
      syncContent(generated.draft);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Draft generate করতে সমস্যা হয়েছে",
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const isSaveBlocked = isPending || activeUploads > 0;

  /**
   * Read the editor's live content at the exact moment the form is submitted.
   * This is the last-resort safety net against any async batching race
   * conditions — the hidden input is updated synchronously before React/the
   * server action builds the FormData.
   */
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (editorRef.current && contentInputRef.current) {
      contentInputRef.current.value = editorRef.current.getData();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post ? "Edit Post" : "Create New Post"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          onSubmit={handleFormSubmit}
          className="space-y-6"
        >
          {post && <input type="hidden" name="id" value={post.id} />}

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-4 rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">AI Draft (Self-RAG)</p>
                <p className="text-xs text-muted-foreground">
                  Topic, keywords, tags থেকে context নিয়ে draft তৈরি করবে
                </p>
              </div>
              <Button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isGeneratingAi}
                variant="secondary"
              >
                {isGeneratingAi ? (
                  "Generating..."
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Draft
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aiTopic">Topic</Label>
                <Input
                  id="aiTopic"
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                  placeholder="e.g. NestJS rate limiting setup"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiTone">Tone</Label>
                <Input
                  id="aiTone"
                  value={aiTone}
                  onChange={(event) => setAiTone(event.target.value)}
                  placeholder="practical and friendly"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiAudience">Audience</Label>
              <Input
                id="aiAudience"
                value={aiAudience}
                onChange={(event) => setAiAudience(event.target.value)}
                placeholder="who will read this post?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiKeywords">
                Focus Keywords (comma separated)
              </Label>
              <Input
                id="aiKeywords"
                value={aiKeywords}
                onChange={(event) => setAiKeywords(event.target.value)}
                placeholder="nestjs, redis, throttler"
              />
            </div>

            {aiError && (
              <p className="text-xs text-destructive" role="alert">
                {aiError}
              </p>
            )}

            {(aiSourcesUsed > 0 || aiReviewNotes.length > 0) && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Retrieved sources: {aiSourcesUsed}</p>
                {aiReviewNotes.length > 0 && (
                  <p>Review notes: {aiReviewNotes.join(" | ")}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={titleValue}
              onChange={(event) => setTitleValue(event.target.value)}
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
            {/*
             * UNCONTROLLED hidden input: React does not own this value after
             * mount. handleEditorChange writes to it directly via
             * contentInputRef so that the DOM is always up-to-date even when
             * React's batched state scheduler hasn't flushed yet (e.g. right
             * after an async image-upload XHR completes).
             */}
            <input
              type="hidden"
              name="content"
              ref={contentInputRef}
              defaultValue={post?.content ?? ""}
            />
            <div className="rounded-md border bg-background">
              <Editor
                data={contentValue}
                onChange={handleEditorChange}
                onReady={(editor) => {
                  editorRef.current = editor;
                }}
              />
            </div>
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

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaveBlocked}>
              {activeUploads > 0 ? (
                "Uploading image…"
              ) : isPending ? (
                "Saving…"
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {post ? "Update Post" : "Create Post"}
                </>
              )}
            </Button>

            {/* Autosave status indicator (edit mode only) */}
            {post?.id && (
              <span className="text-xs text-muted-foreground">
                {isAutosaving
                  ? "Auto-saving…"
                  : autosaveError
                    ? `Auto-save failed: ${autosaveError}`
                    : ""}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
