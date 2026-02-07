import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPosts } from "@/lib/api/posts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { Calendar, User } from "lucide-react";

export const metadata: Metadata = { title: "Posts" };

interface PostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const result = await getPosts(page, 9);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Blog Posts</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore our latest articles and stories
        </p>
      </div>

      {result.data.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted-foreground">No posts yet.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`}>
                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                  {post.featuredImageUrl && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={post.featuredImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    {post.tags?.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <CardTitle className="line-clamp-2 text-lg leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {post.content && (
                      <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                        {post.content.substring(0, 150)}
                        {post.content.length > 150 ? "..." : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {post.author && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author.firstName} {post.author.lastName || ""}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedOn).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-10">
            <PaginationControls
              currentPage={result.meta.currentPage}
              totalPages={result.meta.totalPages}
            />
          </div>
        </>
      )}
    </div>
  );
}
