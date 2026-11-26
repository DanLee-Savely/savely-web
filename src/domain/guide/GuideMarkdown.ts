import { GuideFormatError } from "./errors";

// 가이드 글 본문(마크다운의 일부)을 블록으로 읽는다 (91-content §4-3).
// 지원: 소제목(## · ###) · 문단 · 목록(- · 1.) · 굵게(**) · 링크([글](주소)). 그 밖의 문법은 읽지 않고 오류로 알린다 —
// 모르는 문법이 기호째 화면에 나가는 것보다 빌드 · 테스트에서 멈추는 편이 낫다.
// 결과는 HTML 문자열이 아니라 블록 값이다. 화면은 이 값을 요소로 그대로 그린다(문자열을 끼워 넣지 않는다)

export type GuideInline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; text: string; href: string };

export type GuideBlock =
  | { type: "heading"; level: 2 | 3; inlines: GuideInline[] }
  | { type: "paragraph"; inlines: GuideInline[] }
  | { type: "list"; ordered: boolean; items: GuideInline[][] };

const HEADING = /^(#{2,3})\s+(.+)$/;
const BULLET = /^-\s+(.+)$/;
const NUMBERED = /^\d+\.\s+(.+)$/;
/** 지원하지 않는 블록의 첫머리: 큰 제목(#) · 더 작은 제목(####) · 인용 · 코드 · 표 · 그림 · HTML · 가로줄 · 별표 목록 */
const UNSUPPORTED = /^(#(\s|$)|#{4,}|>|```|~~~|\||!\[|<|---+$|\*\s)/;
const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
/** 읽고 남은 글자에 문법 기호가 남아 있으면 짝이 맞지 않은 것이다 */
const LEFTOVER = /\*\*|\]\(|`/;
/** 사이트 안 주소(/로 시작하거나 우리 도메인) */
const INTERNAL = /^(\/|https:\/\/(www\.)?savelyglobal\.com)/;

export class GuideMarkdown {
  static parse(body: string): GuideBlock[] {
    const blocks: GuideBlock[] = [];
    let paragraph: string[] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ type: "paragraph", inlines: GuideMarkdown.inline(paragraph.join(" ")) });
      paragraph = [];
    };

    for (const raw of body.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) {
        flush();
        continue;
      }
      if (UNSUPPORTED.test(line)) throw new GuideFormatError("UNSUPPORTED_SYNTAX");
      const heading = HEADING.exec(line);
      const item = BULLET.exec(line) ?? NUMBERED.exec(line);
      if (heading) {
        flush();
        blocks.push({ type: "heading", level: heading[1].length as 2 | 3, inlines: GuideMarkdown.inline(heading[2]) });
      } else if (item) {
        flush();
        GuideMarkdown.addItem(blocks, NUMBERED.test(line), GuideMarkdown.inline(item[1]));
      } else {
        paragraph.push(line);
      }
    }
    flush();
    return blocks;
  }

  /** 바로 앞 블록이 같은 종류의 목록이면 거기에 잇고, 아니면 새 목록을 연다 */
  private static addItem(blocks: GuideBlock[], ordered: boolean, item: GuideInline[]): void {
    const last = blocks.at(-1);
    if (last?.type === "list" && last.ordered === ordered) last.items.push(item);
    else blocks.push({ type: "list", ordered, items: [item] });
  }

  private static inline(text: string): GuideInline[] {
    const out: GuideInline[] = [];
    let at = 0;
    for (const m of text.matchAll(INLINE)) {
      if (m.index > at) out.push(GuideMarkdown.plain(text.slice(at, m.index)));
      out.push(m[1] !== undefined ? { type: "strong", text: m[1] } : { type: "link", text: m[2], href: GuideMarkdown.href(m[3]) });
      at = m.index + m[0].length;
    }
    if (at < text.length) out.push(GuideMarkdown.plain(text.slice(at)));
    return out;
  }

  private static plain(text: string): GuideInline {
    if (LEFTOVER.test(text)) throw new GuideFormatError("UNSUPPORTED_SYNTAX");
    return { type: "text", text };
  }

  /** 링크 주소: 사이트 안 경로(/…) 또는 https 주소만. 사이트 안 링크에는 UTM을 붙이지 않는다(방문 경로가 덮여 측정이 틀어진다, 91 §4-10) */
  private static href(href: string): string {
    if (!/^(\/[^/]|https:\/\/)/.test(href) && href !== "/") throw new GuideFormatError("INVALID_LINK");
    if (INTERNAL.test(href) && /[?&]utm_/.test(href)) throw new GuideFormatError("UTM_ON_INTERNAL_LINK");
    return href;
  }
}
