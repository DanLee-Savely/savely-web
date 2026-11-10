import { Skeleton } from "./Skeleton";

// 홈 · 달력 · 리포트 로딩: 머리말 + 카드 모양 회색 막대
export function DashSkeleton({ columns = "xl:grid-cols-[1fr_420px]", cards = 4 }: { columns?: string; cards?: number }) {
  return (
    <div aria-busy className="mt-7 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className={`grid gap-5 ${columns}`}>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="flex h-64 flex-col gap-4 rounded-sv-lg border border-sv-border-2 bg-sv-surface p-6">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
