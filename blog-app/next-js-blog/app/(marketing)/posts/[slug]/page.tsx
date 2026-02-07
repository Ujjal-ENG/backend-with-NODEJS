import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api/posts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User } from "lucide-react";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.content?.substring(0, 160),
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/posts">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Posts
        </Link>
      </Button>

      {post.featuredImageUrl && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-xl">
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {post.tags?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight">
        {post.title}
      </h1>

      <div className="mb-8 flex items-center gap-4 text-sm text-muted-foreground">
        {post.author && (
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {post.author.firstName} {post.author.lastName || ""}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <time dateTime={post.publishedOn}>
            {new Date(post.publishedOn).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </span>
      </div>

      <Separator className="mb-8" />

      <div className="prose prose-stone dark:prose-invert max-w-none leading-relaxed">
        {post.content?.split("\n").map((paragraph, i) =>
          paragraph.trim() ? <p key={i}>{paragraph}</p> : null,
        )}
      </div>
    </article>
  );
}
