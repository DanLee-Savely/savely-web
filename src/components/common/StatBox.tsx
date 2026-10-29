import { cn } from "@/lib/utils";

// S04 수치 · 문제 카드가 함께 쓰는 박스(00-decisions A8). 한 행에 놓으면 flex 늘이기로 높이가 같아진다
export const statBox = "flex flex-col gap-3 rounded-sv-lg bg-sv-surface p-5 lg:p-6";

type Part = { readonly num: string; readonly unit: string };

// [숫자 + 단위] 묶음 — 숫자-단위 4, 묶음 사이 10, 기준선 정렬. srText가 있으면 스크린리더는 그 값만 읽는다
export function StatValue({ parts, srText, numClassName }: { parts: readonly Part[]; srText?: string; numClassName?: string }) {
  return (
    <p className="flex items-baseline gap-2.5">
      {srText && <span className="sr-only">{srText}</span>}
      {parts.map((p) => (
        <span key={p.num} aria-hidden={!!srText} className="flex items-baseline gap-1">
          <span className={cn("sv-text-amount-44 text-sv-text", numClassName)}>{p.num}</span>
          <span className="sv-text-title-section-20 text-sv-text-2">{p.unit}</span>
        </span>
      ))}
    </p>
  );
}
