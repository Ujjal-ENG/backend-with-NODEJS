import { Skeleton } from "@/components/ui/skeleton";

export default function PostDetailsLoading() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <Skeleton className="mb-6 h-9 w-40" />

      <Skeleton className="mb-8 aspect-video w-full rounded-xl" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-14" />
      </div>

      <Skeleton className="mb-3 h-12 w-full" />
      <Skeleton className="mb-4 h-12 w-4/5" />

      <div className="mb-8 flex items-center gap-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-44" />
      </div>

      <Skeleton className="mb-8 h-px w-full" />

      <div className="space-y-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-10/12" />
        <Skeleton className="h-5 w-9/12" />
      </div>
    </article>
  );
}
