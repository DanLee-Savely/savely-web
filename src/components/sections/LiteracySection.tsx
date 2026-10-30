import { BreakText } from "@/components/common/BreakText";
import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { StatValue, statBox } from "@/components/common/StatBox";
import { LiteracyStats } from "@/components/interactive/LiteracyStats";
import { homeContent, type LiteracyIssue } from "@/content/home.content";
import { cn } from "@/lib/utils";

const { literacy } = homeContent;
const { issues, quote } = literacy;

// 문제 카드 — 수치 박스와 같은 스타일, 정적(툴팁 없음). 관련 지표는 나란히만 보여준다(00-decisions A10)
function IssueCard({ issue }: { issue: LiteracyIssue }) {
  return (
    <li className={cn(statBox, "lg:flex-1")}>
      <p className="sv-text-label-15 text-sv-text">{issue.label}</p>
      <StatValue parts={issue.value} srText={issue.valueText} />
      <p className="sv-text-support-14_5 text-sv-text-2">
        <BreakText text={issue.desc} />
      </p>
      <p className="sv-text-support-13 text-sv-text-2">
        <span className="text-sv-text-3">{issues.relatedLabel} · </span>
        {issue.related}
      </p>
    </li>
  );
}

// 04 금융 문해력 — 머리말 → 수치(I4) → 문제 카드 → 「금융문해력이란?」 카드 → 출처. 간격 PC 48 · 모바일 32
export function LiteracySection() {
  return (
    <Section name="04-literacy" id={literacy.id} background="page">
      <div className="flex flex-col gap-8 lg:gap-12">
        <SectionHeader eyebrow={literacy.eyebrow} title={literacy.title} desc={literacy.desc} />
        <LiteracyStats />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="sv-text-title-section-20 text-sv-text">
              <BreakText text={issues.title} />
            </h3>
            <p className="sv-text-body-15 text-sv-text-2">
              <BreakText text={issues.desc} />
            </p>
          </div>
          <ul className="flex flex-col gap-3 lg:flex-row lg:gap-4">
            {issues.cards.map((c) => (
              <IssueCard key={c.label} issue={c} />
            ))}
          </ul>
        </div>
        <figure className="flex flex-col gap-3 rounded-sv-lg bg-sv-surface p-6 lg:flex-row lg:items-center lg:gap-8 lg:p-8">
          <p className="sv-text-title-section-20 text-sv-text lg:w-[180px] lg:shrink-0">{quote.title}</p>
          <div className="flex flex-col gap-2">
            <blockquote className="sv-text-body-15 text-sv-text">{quote.text}</blockquote>
            <figcaption className="sv-text-support-13 text-sv-text-3">{quote.cite}</figcaption>
          </div>
        </figure>
        <p className="sv-text-support-13 text-sv-text-3">
          <BreakText text={literacy.source} />
        </p>
      </div>
    </Section>
  );
}
