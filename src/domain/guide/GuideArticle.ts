import { GuideFormatError } from "./errors";
import { type GuideBlock, GuideMarkdown } from "./GuideMarkdown";

// 가이드 글 한 편 (91-content §4-2). 원고(.md)의 머리말과 본문을 읽어 만든다.
// published만 목록 · 사이트맵 · 검색에 나오고, draft는 주소로도 열리지 않는다 — 그 판단은 GuideCatalog가 한다

export type GuideStatus = "draft" | "published";

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** 값 뒤의 설명(`draft   # draft | published`)을 떼어도 되는 칸. 제목 · 설명문은 글자 그대로 둔다 */
const COMMENTABLE = ["slug", "status", "publishedAt", "updatedAt"];

/** 달력에 있는 날짜인가('YYYY-MM-DD'). 문자열 그대로 본다 */
const isDate = (value: string): boolean => {
  const m = DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return mo >= 1 && mo <= 12 && d >= 1 && d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
};

export class GuideArticle {
  private constructor(
    readonly slug: string,
    readonly title: string,
    /** 검색 결과 설명문 */
    readonly description: string,
    readonly status: GuideStatus,
    /** 'YYYY-MM-DD'. 초안은 아직 정하지 않아 자리만 있을 수 있다(예: 「게시일」) */
    readonly publishedAt: string,
    readonly updatedAt: string,
    readonly blocks: GuideBlock[],
  ) {}

  static parse(source: string): GuideArticle {
    const m = FRONT_MATTER.exec(source);
    if (!m) throw new GuideFormatError("MISSING_FRONT_MATTER");
    const meta = GuideArticle.readMeta(m[1]);
    const field = (name: string): string => {
      const value = meta.get(name);
      if (!value) throw new GuideFormatError("MISSING_FIELD");
      return value;
    };
    const [slug, status, publishedAt, updatedAt] = [field("slug"), field("status"), field("publishedAt"), field("updatedAt")];
    if (!SLUG.test(slug)) throw new GuideFormatError("INVALID_SLUG");
    if (status !== "draft" && status !== "published") throw new GuideFormatError("INVALID_STATUS");
    // 게시하는 글은 날짜가 정해져 있어야 한다. 고친 날은 게시일보다 앞설 수 없다
    if (status === "published" && (!isDate(publishedAt) || !isDate(updatedAt) || updatedAt < publishedAt)) throw new GuideFormatError("INVALID_DATE");
    const blocks = GuideMarkdown.parse(m[2]);
    if (!blocks.length) throw new GuideFormatError("EMPTY_BODY");
    return new GuideArticle(slug, field("title"), field("description"), status, publishedAt, updatedAt, blocks);
  }

  get published(): boolean {
    return this.status === "published";
  }

  /** 게시한 뒤 고친 글인가 */
  get revised(): boolean {
    return this.updatedAt !== this.publishedAt;
  }

  /** 머리말: 한 줄에 `이름: 값` */
  private static readMeta(text: string): Map<string, string> {
    const meta = new Map<string, string>();
    for (const line of text.split(/\r?\n/)) {
      const at = line.indexOf(":");
      if (at < 1) continue;
      const name = line.slice(0, at).trim();
      const value = line.slice(at + 1).trim();
      meta.set(name, COMMENTABLE.includes(name) ? value.replace(/\s+#.*$/, "") : value);
    }
    return meta;
  }
}
