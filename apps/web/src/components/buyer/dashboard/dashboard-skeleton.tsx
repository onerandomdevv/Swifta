import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-10 py-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-96 rounded-xl" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-3xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-8 space-y-8">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-[2.5rem]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
