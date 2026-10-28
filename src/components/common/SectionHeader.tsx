import { BreakText, type ResponsiveText } from "./BreakText";

type SectionHeaderProps = {
  eyebrow: string;
  title: ResponsiveText;
  desc?: ResponsiveText;
};

// 섹션 머리말: eyebrow(Eyebrow/12.5, accent) → 제목(Hero/34) → 설명(Body/15, text-2), gap 12
export function SectionHeader({ eyebrow, title, desc }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="sv-text-eyebrow-12_5 text-sv-accent">{eyebrow}</p>
      <h2 className="sv-text-hero-34 text-sv-text">
        <BreakText text={title} />
      </h2>
      {desc && (
        <p className="sv-text-body-15 text-sv-text-2">
          <BreakText text={desc} />
        </p>
      )}
    </div>
  );
}
