import { DeletePostButton } from "@/components/dashboard/delete-post-button";
import { EditPostModal } from "@/components/dashboard/edit-post-modal";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canCreatePost, canDeletePost, canEditPost } from "@/lib/abac";
import { getPosts } from "@/lib/api/posts";
import { getSession } from "@/lib/auth";
import { UserPlan, UserRole } from "@/types/entities";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Manage Posts" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function PostsManagementPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const session = await getSession();
  const canCreate = canCreatePost(session);
  const isFreeReadOnlyUser =
    session?.role === UserRole.USER && session.plan === UserPlan.FREE;

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
          {isFreeReadOnlyUser ? (
            <p className="text-xs text-muted-foreground">
              Free plan: you can create up to 5 posts per day, and existing
              posts are read-only.
            </p>
          ) : null}
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/dashboard/posts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        ) : null}
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
                    <TableCell className="max-w-62.5 truncate font-medium">
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
                    <TableCell className="capitalize">
                      {post.postType}
                    </TableCell>
                    <TableCell>
                      {new Date(post.publishedOn).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditPost(session, post) ? (
                          <EditPostModal post={post} />
                        ) : null}
                        {canDeletePost(session, post) ? (
                          <DeletePostButton
                            postId={post.id}
                            postTitle={post.title}
                          />
                        ) : null}
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
