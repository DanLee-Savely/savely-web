import { cn } from "@/lib/utils";

// 회색 막대 (로딩)
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-sv-pill bg-sv-surface-3 motion-reduce:animate-none", className)} />;
}

/** 기록 행 모양 10줄 (§4-1) */
export function RecordListSkeleton() {
  return (
    <ul aria-busy className="rounded-sv-lg border border-sv-border-2 bg-sv-surface px-6 py-1">
      {Array.from({ length: 10 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 border-b border-sv-border-2 py-4 last:border-b-0">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-2.5 w-56" />
          </div>
          <Skeleton className="hidden h-2.5 w-24 md:block" />
          <Skeleton className="h-2.5 w-20" />
        </li>
      ))}
    </ul>
  );
}
