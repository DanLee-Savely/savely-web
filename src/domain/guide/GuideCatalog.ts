import { GuideFormatError } from "./errors";
import type { GuideArticle } from "./GuideArticle";

// 가이드 글 모음 (91-content §4-2). 밖으로 내보내는 것은 published 글뿐이다 —
// 목록 · 글 주소 · 사이트맵이 모두 여기를 거치므로 draft는 어디에도 나오지 않는다
export class GuideCatalog {
  private readonly articles: readonly GuideArticle[];

  constructor(articles: readonly GuideArticle[]) {
    if (new Set(articles.map((a) => a.slug)).size !== articles.length) throw new GuideFormatError("DUPLICATE_SLUG");
    this.articles = articles;
  }

  /** 게시한 글, 새 글부터. 같은 날이면 slug 순서 */
  get published(): GuideArticle[] {
    return this.articles
      .filter((a) => a.published)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
  }

  /** 게시한 글만 찾는다. draft와 없는 slug는 null — 화면은 404로 답한다 */
  find(slug: string): GuideArticle | null {
    return this.published.find((a) => a.slug === slug) ?? null;
  }
}
