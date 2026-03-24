"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-12">
      <div className="space-y-12">
        {/* Hero skeleton */}
        <div className="space-y-6 pt-12">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-[500px] max-w-full" />
          <Skeleton className="h-6 w-96 max-w-full" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-14 w-40" />
              <Skeleton className="h-1 w-full" />
            </div>
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
