import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { LiteracyStats } from "@/components/interactive/LiteracyStats";
import { homeContent } from "@/content/home.content";

const { literacy } = homeContent;
const { quote } = literacy;

// 04 금융 문해력 — 머리말 → 수치(I4) → 「금융문해력이란?」 카드 → 출처. 간격 PC 48 · 모바일 32
export function LiteracySection() {
  return (
    <Section name="04-literacy" id={literacy.id} background="page">
      <div className="flex flex-col gap-8 lg:gap-12">
        <SectionHeader eyebrow={literacy.eyebrow} title={literacy.title} desc={literacy.desc} />
        <LiteracyStats />
        <figure className="flex flex-col gap-3 rounded-sv-lg bg-sv-surface p-6 lg:flex-row lg:items-center lg:gap-8 lg:p-8">
          <p className="sv-text-title-section-20 text-sv-text lg:w-[180px] lg:shrink-0">{quote.title}</p>
          <div className="flex flex-col gap-2">
            <blockquote className="sv-text-body-15 text-sv-text">{quote.text}</blockquote>
            <figcaption className="sv-text-support-13 text-sv-text-3">{quote.cite}</figcaption>
          </div>
        </figure>
        <p className="sv-text-support-13 text-sv-text-3">{literacy.source}</p>
      </div>
    </Section>
  );
}
