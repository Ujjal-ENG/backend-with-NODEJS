import type { Metadata } from "next";
import { getPosts } from "@/lib/api/posts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TagForm } from "@/components/dashboard/tag-form";
import { DeleteTagButton } from "@/components/dashboard/delete-tag-button";
import type { Tag } from "@/types/entities";

export const metadata: Metadata = { title: "Manage Tags" };

export default async function TagsManagementPage() {
  // Extract unique tags from posts since backend lacks GET /tags
  let tagsMap = new Map<number, Tag>();
  try {
    const result = await getPosts(1, 100);
    for (const post of result.data) {
      for (const tag of post.tags || []) {
        if (!tagsMap.has(tag.id)) {
          tagsMap.set(tag.id, tag);
        }
      }
    }
  } catch {
    // API might not be available
  }

  const tags = Array.from(tagsMap.values());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage blog tags
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <TagForm />

        <Card>
          <CardHeader>
            <CardTitle>
              Existing Tags
              <Badge variant="secondary" className="ml-2">
                {tags.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No tags found. Create one above!
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tag.slug}
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteTagButton
                          tagId={tag.id}
                          tagName={tag.name}
                          soft
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
