import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardTagsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-24" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b p-4">
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-b p-4 last:border-b-0">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="ml-auto h-8 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
