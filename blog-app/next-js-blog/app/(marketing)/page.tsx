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
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";

export default async function HomePage() {
  let recentPosts: Awaited<ReturnType<typeof getPosts>>["data"] = [];
  try {
    const result = await getPosts(1, 6);
    recentPosts = result.data;
  } catch {
    // API might not be available
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Share Your Ideas
            <br />
            <span className="text-muted-foreground">With the World</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A modern blog platform built with Next.js and NestJS. Write,
            publish, and share your stories with a beautiful reading experience.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/posts">
                Browse Posts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      {recentPosts.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Recent Posts
              </h2>
              <p className="mt-1 text-muted-foreground">
                Check out our latest articles
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/posts">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
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
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <CardTitle className="line-clamp-2 text-lg leading-snug transition-colors group-hover:text-primary">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {post.content && (
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {post.content.substring(0, 120)}
                        {post.content.length > 120 ? "..." : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {post.author && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author.firstName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedOn).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Start Writing?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Create an account and start sharing your thoughts with the world
            today.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/sign-up">Create Your Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
