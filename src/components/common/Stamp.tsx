import {
  BusIcon,
  CoffeeIcon,
  FlameIcon,
  ShoppingCartIcon,
  UtensilsIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { homeContent } from "@/content/home.content";
import { stampFx, type DayMark } from "@/interaction/motion";
import { cn } from "@/lib/utils";

// A안 공용 모양 — 날짜 원 · 요일 · 기록 카드 · 떠 있는 카드 틀 (20-interactions A안 공통). 모두 장식이라 부모에서 aria-hidden
const { stamps } = homeContent;

const look = {
  on: "bg-sv-accent text-sv-on-accent font-bold!",
  today:
    "text-sv-accent font-bold! shadow-[inset_0_0_0_1.5px_var(--sv-accent)]",
  off: "text-sv-day-muted",
  empty: "text-sv-day-empty",
};

/** 날짜 원 하나. 크기는 className(size-6 등)으로 정한다 */
export function StampDay({
  mark,
  className,
}: {
  mark: DayMark;
  className?: string;
}) {
  const fx = stampFx(mark.since);
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full sv-text-mono-day-11",
        look[mark.look],
        className,
      )}
      style={fx.scale === 1 ? undefined : { transform: `scale(${fx.scale})` }}
    >
      {mark.n}
      {fx.ring > 0 && (
        <i
          className="absolute -inset-px rounded-full border-2 border-sv-accent"
          style={{ opacity: fx.ring, transform: `scale(${fx.ringScale})` }}
        />
      )}
    </span>
  );
}

/** 요일 줄 + 날짜 격자. cols = 두 격자가 함께 쓰는 열 설정, rows = 날짜 격자의 줄 간격, lead = 1일 앞 빈칸 수 */
export function StampGrid({
  days,
  lead = 0,
  weekdays = stamps.weekdays,
  dayClass,
  cols,
  rows,
}: {
  days: readonly DayMark[];
  lead?: number;
  weekdays?: readonly string[];
  dayClass: string;
  cols: string;
  rows?: string;
}) {
  return (
    <div>
      <div className={cn("grid", cols)}>
        {weekdays.map((d) => (
          <span
            key={d}
            className="text-center sv-text-caption-11 text-sv-text-3"
          >
            {d}
          </span>
        ))}
      </div>
      <div className={cn("grid", cols, rows)}>
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((m) => (
          <StampDay key={m.n} mark={m} className={dayClass} />
        ))}
      </div>
    </div>
  );
}

/** 1일이 목요일인 10월에서 n일의 요일 번호(월 = 0) */
export const weekdayOf = (n: number) => (stamps.month.firstWeekday + n - 1) % 7;

/** 떠 있는 카드 틀(반투명 흰 배경 + 흐림 + 테두리) */
export const floatCard =
  "border border-sv-border-2 bg-sv-surface-float backdrop-blur-[8px]";

/** 「{n}일 연속 정산 중」 머리 — 불꽃 아이콘 + n(Mono/Amount 13) */
export function StreakHead({ n, scale = 1 }: { n: number; scale?: number }) {
  const [before, after] = stamps.streak.split("{n}");
  return (
    <p className="flex items-center gap-2 whitespace-nowrap sv-text-support-13 text-sv-text-2">
      <IconDot>
        <FlameIcon className="size-[15px]" />
      </IconDot>
      <span>
        {before}
        <b
          className="inline-block min-w-[2ch] text-right sv-text-mono-amount-13 text-sv-text"
          style={scale === 1 ? undefined : { transform: `scale(${scale})` }}
        >
          {n}
        </b>
        {after}
      </span>
    </p>
  );
}

export function IconDot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-[26px] shrink-0 place-items-center rounded-full bg-sv-accent-tint-2 text-sv-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}

const recordIcons = {
  coffee: CoffeeIcon,
  meal: UtensilsIcon,
  bus: BusIcon,
  cart: ShoppingCartIcon,
};

/** 기록 카드: 아이콘 + 항목 + 금액. amount를 넘기면 그 값을 대신 보여준다(05 입력 중) */
export function RecordChip({
  record,
  amount,
  children,
  className,
  style,
}: {
  record: (typeof stamps.records)[number];
  amount?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = recordIcons[record.icon];
  return (
    <div
      className={cn(
        "flex w-max items-center gap-2 rounded-sv-pill py-[7px] pr-3.5 pl-[7px] shadow-sv-float sv-text-support-13 text-sv-text-2",
        floatCard,
        className,
      )}
      style={style}
    >
      <IconDot className="size-7">
        <Icon strokeWidth={2} className="size-4" />
      </IconDot>
      <span>{record.label}</span>
      <b className="sv-text-mono-amount-13 text-sv-text">
        {amount ?? record.amount}
      </b>
      {children}
    </div>
  );
}
