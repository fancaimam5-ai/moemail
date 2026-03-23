import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-md skeleton-shimmer", className)}
      role="status"
      aria-label="Loading"
    />
  )
}

export function EmailItemSkeleton() {
  return (
    <div className="flex items-center gap-2 p-2">
      <Skeleton className="h-4 w-4 rounded shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function MessageItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-4 w-4 rounded shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function EmailListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <EmailItemSkeleton key={i} />
      ))}
    </div>
  )
}

export function MessageListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-primary/10">
      {Array.from({ length: count }).map((_, i) => (
        <MessageItemSkeleton key={i} />
      ))}
    </div>
  )
}
