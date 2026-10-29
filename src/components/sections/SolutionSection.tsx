import Image from "next/image";
import { appScreens, screenAlt } from "@/assets";
import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { SolutionSteps } from "@/components/interactive/SolutionSteps";
import { homeContent } from "@/content/home.content";

const { solution } = homeContent;
const CROP_TOP = [-81, -67, -242]; // Figma: 캡처를 302×671 칸에 꽉 채우고 이 세로 위치로 잘라 보여준다

// 05 해결 — PC는 단계 전환(I5) + 휴대폰, 모바일은 카드 3장 나열. 간격 PC 48 · 모바일 32
export function SolutionSection() {
  return (
    <Section name="05-solution" id={solution.id}>
      <div className="flex flex-col gap-8 lg:gap-12">
        <SectionHeader eyebrow={solution.eyebrow} title={solution.title} desc={solution.desc} />
        <SolutionSteps />
        <ol className="flex flex-col gap-3 lg:hidden">
          {solution.steps.map((s, i) => (
            <li key={s.no} className="flex flex-col gap-4 rounded-sv-lg bg-sv-surface p-6">
              <div className="relative h-60 overflow-hidden rounded-xl bg-sv-surface-2">
                <Image
                  src={appScreens[s.image]}
                  alt={screenAlt(s.image)}
                  sizes="302px"
                  className="absolute left-0 h-[671px] w-full object-cover"
                  style={{ top: CROP_TOP[i] }}
                />
              </div>
              <div className="flex flex-col gap-2 p-2">
                <span className="sv-text-mono-13 text-sv-accent">{s.no}</span>
                <h3 className="sv-text-title-section-20 text-sv-text">{s.title}</h3>
                <p className="sv-text-support-14_5 text-sv-text-2">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
