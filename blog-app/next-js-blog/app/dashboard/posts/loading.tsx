import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPostsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-28" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4">
            <div className="grid grid-cols-5 gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          </div>

          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="border-b p-4 last:border-b-0">
              <div className="grid grid-cols-5 items-center gap-4">
                <Skeleton className="h-5 w-10/12" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-24" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-10" />
        <Skeleton className="h-9 w-10" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}
