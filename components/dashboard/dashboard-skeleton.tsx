import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 py-2">
      {/* Top Banner Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hero Card */}
          <Skeleton className="h-64 sm:h-76 w-full rounded-3xl" />

          {/* Map Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40 rounded-xl" />
              <Skeleton className="h-6 w-20 rounded-xl" />
            </div>
            <Skeleton className="h-60 w-full rounded-3xl" />
          </div>

          {/* Places rows */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-48 rounded-xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4">
          <Skeleton className="h-[520px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  )
}
