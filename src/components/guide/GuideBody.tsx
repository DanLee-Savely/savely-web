import Link from "next/link";
import type { GuideBlock, GuideInline } from "@/domain/guide/GuideMarkdown";

// 가이드 글 본문 — GuideMarkdown이 읽은 블록을 요소로 그린다(HTML 문자열을 끼워 넣지 않는다).
// 글자 스타일은 소개 사이트 그대로: 소제목 Title/Section 20 · 본문 Body/15

function Inlines({ inlines }: { inlines: GuideInline[] }) {
  return inlines.map((inline, i) => {
    if (inline.type === "strong") return <strong key={i} className="font-semibold text-sv-text">{inline.text}</strong>;
    if (inline.type === "text") return inline.text;
    const className = "text-sv-accent underline underline-offset-2 hover:text-sv-accent-deep";
    // 사이트 안 주소는 화면 안에서 이동하고, 밖의 주소는 새 창으로 연다
    return inline.href.startsWith("/") ? (
      <Link key={i} href={inline.href} className={className}>{inline.text}</Link>
    ) : (
      <a key={i} href={inline.href} target="_blank" rel="noopener noreferrer" className={className}>{inline.text}</a>
    );
  });
}

export function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="flex flex-col gap-4 sv-text-body-15 break-keep text-sv-text-2">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag key={i} className={block.level === 2 ? "mt-6 sv-text-title-section-20 text-sv-text" : "mt-2 sv-text-label-15 text-sv-text"}>
              <Inlines inlines={block.inlines} />
            </Tag>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={i}>
              <Inlines inlines={block.inlines} />
            </p>
          );
        }
        const Tag = block.ordered ? "ol" : "ul";
        return (
          <Tag key={i} className={`flex flex-col gap-1.5 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>
            {block.items.map((item, k) => (
              <li key={k}>
                <Inlines inlines={item} />
              </li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}
