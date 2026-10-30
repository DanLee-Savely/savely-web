import { GrowOnView } from "@/components/interactive/GrowOnView";
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

// I4 막대 성장: 0 → 값으로 0.8초 ease-out, 라벨은 함께 나타난다 (GrowOnView 안에서)
const grow = "transition-transform duration-800 ease-out group-data-grown:scale-100 motion-reduce:transition-none";
const appear = "opacity-0 transition-opacity duration-800 group-data-grown:opacity-100 motion-reduce:transition-none";

// 수치 막대(D8) — 0~100 트랙, 값이 OECD 평균 이상이면 accent · 미만이면 risk. 평균 위치에 기준선 + 라벨
export function StatBar({ value, avg }: { value: number; avg: { readonly value: number; readonly label: string } }) {
  return (
    <GrowOnView className="flex flex-col gap-2">
      <div aria-hidden className="relative h-2 rounded-[4px] bg-sv-surface-3">
        <div
          className={cn("h-full origin-left scale-x-0 rounded-[4px]", grow, value >= avg.value ? "bg-sv-accent" : "bg-sv-risk")}
          style={{ width: `${value}%` }}
        />
        <div className="absolute top-1/2 h-4 w-0.5 -translate-1/2 bg-sv-text" style={{ left: `${avg.value}%` }} />
      </div>
      <p className="relative w-fit -translate-x-1/2 whitespace-nowrap sv-text-support-13 text-sv-text-3" style={{ left: `${avg.value}%` }}>
        {avg.label}
      </p>
    </GrowOnView>
  );
}

type Bar = { readonly label: string; readonly value: number; readonly valueLabel?: string };

// 문제 카드 그래프(D8) — 높이 96, 기준선 y=70, 막대는 0부터 최대 46 · 마지막 막대만 risk
// 3개 이상이면 막대 24에 값 라벨은 처음(왼쪽 정렬) · 끝(오른쪽 정렬)만, 2개면 막대 56에 막대 위 가운데
export function BarChart({ bars }: { bars: readonly Bar[] }) {
  const max = Math.max(...bars.map((b) => b.value));
  const wide = bars.length > 2;
  return (
    <GrowOnView className="relative flex h-24">
      <span aria-hidden className="absolute inset-x-0 top-[70px] h-px bg-sv-border" />
      {bars.map((b, i) => {
        const last = i === bars.length - 1;
        const h = (b.value / max) * 46;
        return (
          <div key={b.label} className="relative flex-1">
            {b.valueLabel && (
              <span
                className={cn(
                  "absolute whitespace-nowrap sv-text-label-13",
                  appear,
                  last ? "text-sv-text" : "text-sv-text-3",
                  wide ? (last ? "right-0" : "left-0") : "left-1/2 -translate-x-1/2",
                )}
                style={{ bottom: 28 + h }}
              >
                {b.valueLabel}
              </span>
            )}
            <span
              aria-hidden
              className={cn(
                "absolute bottom-[26px] left-1/2 origin-bottom -translate-x-1/2 scale-y-0 rounded-t-[4px]",
                grow,
                wide ? "w-6" : "w-14",
                last ? "bg-sv-risk" : "bg-sv-border",
              )}
              style={{ height: h }}
            />
            <span
              className={cn(
                "absolute inset-x-0 top-[74px] text-center sv-text-support-13",
                last ? "text-sv-text-2" : "text-sv-text-3",
              )}
            >
              {b.label}
            </span>
          </div>
        );
      })}
    </GrowOnView>
  );
}
