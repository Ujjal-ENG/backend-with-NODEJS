import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingHomeLoading() {
  return (
    <div>
      <section className="border-b bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-24 text-center">
          <Skeleton className="mx-auto h-14 w-full max-w-2xl" />
          <Skeleton className="mx-auto mt-4 h-14 w-4/5 max-w-xl" />
          <Skeleton className="mx-auto mt-6 h-5 w-full max-w-xl" />
          <Skeleton className="mx-auto mt-3 h-5 w-3/4 max-w-lg" />
          <div className="mt-8 flex justify-center gap-4">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-52" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-3 p-6">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex gap-3 pt-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <Skeleton className="mx-auto h-9 w-80 max-w-full" />
          <Skeleton className="mx-auto mt-4 h-5 w-96 max-w-full" />
          <Skeleton className="mx-auto mt-3 h-5 w-80 max-w-full" />
          <Skeleton className="mx-auto mt-6 h-11 w-52" />
        </div>
      </section>
    </div>
  );
}
