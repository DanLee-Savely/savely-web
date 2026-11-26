import type { GuideArticle } from "@/domain/guide/GuideArticle";
import type { GuideCatalog } from "@/domain/guide/GuideCatalog";

// 가이드 글의 주소 · 날짜 표기 · 구조화 데이터 · 사이트맵 (91-content §4-7 · §4-8)

export const GUIDE_LIST_PATH = "/home/guide";
export const guidePath = (slug: string): string => `${GUIDE_LIST_PATH}/${slug}`;

/** 'YYYY-MM-DD' → 「2026년 12월 1일」. 날짜는 문자열 그대로 읽는다 */
export const formatGuideDate = (date: string): string => `${Number(date.slice(0, 4))}년 ${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;

/** 검색엔진에 주는 시각. 게시일은 한국 날짜라 한국 시간 0시로 적는다 */
const isoDate = (date: string): string => `${date}T00:00:00+09:00`;

export type SiteIdentity = {
  /** https://www.savelyglobal.com */
  origin: string;
  /** 세이블리 */
  name: string;
  /** 로고 그림의 전체 주소 */
  logo: string;
};

/** 글마다 넣는 Article JSON-LD. author · publisher는 Organization 세이블리 */
export function articleJsonLd(article: GuideArticle, site: SiteIdentity): Record<string, unknown> {
  const url = `${site.origin}${guidePath(article.slug)}`;
  const organization = { "@type": "Organization", name: site.name, url: `${site.origin}/home` };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    inLanguage: "ko",
    datePublished: isoDate(article.publishedAt),
    dateModified: isoDate(article.updatedAt),
    author: organization,
    publisher: { ...organization, logo: { "@type": "ImageObject", url: site.logo } },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

/** `<script type="application/ld+json">` 안에 넣을 글자. `<`를 풀어 써서 원고의 글자가 태그를 닫지 못하게 한다 */
export const jsonLdText = (data: unknown): string => JSON.stringify(data).replace(/</g, "\\u003c");

export type SitemapEntry = { path: string; lastModified?: string };

/** 늘 있는 페이지. 주소 목록은 여기 한곳에서 관리한다 */
const STATIC_PATHS = ["/home", "/home/privacy"];

/**
 * 사이트맵에 넣을 주소. 게시한 가이드 글은 고친 날짜와 함께 자동으로 들어간다.
 * 가이드 목록은 게시한 글이 1편 이상일 때만 넣는다(0편이면 목록 주소가 404다)
 */
export function sitemapEntries(catalog: GuideCatalog): SitemapEntry[] {
  const articles = catalog.published;
  const newest = articles.map((a) => a.updatedAt).sort().at(-1);
  return [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...(newest ? [{ path: GUIDE_LIST_PATH, lastModified: newest }] : []),
    ...articles.map((a) => ({ path: guidePath(a.slug), lastModified: a.updatedAt })),
  ];
}
