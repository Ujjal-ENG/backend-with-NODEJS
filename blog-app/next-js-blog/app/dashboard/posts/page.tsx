import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/api/posts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import { DeletePostButton } from "@/components/dashboard/delete-post-button";
import { Plus, Pencil } from "lucide-react";

export const metadata: Metadata = { title: "Manage Posts" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function PostsManagementPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  let result;
  try {
    result = await getPosts(page, 10);
  } catch {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Failed to load posts. Make sure the API server is running.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">
            {result.meta.totalItems} total posts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No posts found. Create your first post!
                  </TableCell>
                </TableRow>
              ) : (
                result.data.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[250px] truncate font-medium">
                      {post.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          post.status === "published" ? "default" : "secondary"
                        }
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{post.postType}</TableCell>
                    <TableCell>
                      {new Date(post.publishedOn).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/posts/${post.id}/edit`}>
                            <Pencil className="mr-1 h-3 w-3" />
                            Edit
                          </Link>
                        </Button>
                        <DeletePostButton
                          postId={post.id}
                          postTitle={post.title}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaginationControls
        currentPage={result.meta.currentPage}
        totalPages={result.meta.totalPages}
      />
    </div>
  );
}
