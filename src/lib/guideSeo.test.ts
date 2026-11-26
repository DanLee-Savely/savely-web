import { describe, expect, it } from "vitest";
import { GuideArticle } from "@/domain/guide/GuideArticle";
import { GuideCatalog } from "@/domain/guide/GuideCatalog";
import { articleJsonLd, formatGuideDate, jsonLdText, siteJsonLd, sitemapEntries } from "./guideSeo";

const article = (slug: string, status: string, publishedAt: string, updatedAt = publishedAt) =>
  GuideArticle.parse(`---\ntitle: ${slug} 제목\ndescription: ${slug} 설명\nslug: ${slug}\nstatus: ${status}\npublishedAt: ${publishedAt}\nupdatedAt: ${updatedAt}\n---\n\n본문\n`);
const site = { origin: "https://www.savelyglobal.com", name: "세이블리", logo: "https://www.savelyglobal.com/home/icon.png" };

describe("사이트맵 (91-content §4-8)", () => {
  it("게시한 글이 없으면 늘 있는 페이지뿐이다 — 가이드 목록도 없다(404라서)", () => {
    const catalog = new GuideCatalog([article("draft-post", "draft", "게시일")]);
    expect(sitemapEntries(catalog).map((e) => e.path)).toEqual(["/home", "/home/privacy"]);
  });

  it("게시한 글은 고친 날짜와 함께 자동으로 들어가고, 초안은 들어가지 않는다. 목록의 날짜는 가장 최근에 고친 글의 날짜다", () => {
    const catalog = new GuideCatalog([article("a-post", "published", "2026-12-01", "2026-12-10"), article("b-post", "published", "2026-12-08"), article("c-draft", "draft", "게시일")]);
    expect(sitemapEntries(catalog).slice(2)).toEqual([
      { path: "/home/guide", lastModified: "2026-12-10" },
      { path: "/home/guide/b-post", lastModified: "2026-12-08" },
      { path: "/home/guide/a-post", lastModified: "2026-12-10" },
    ]);
  });
});

describe("사이트맵 수정일 · 소개 페이지 구조화 데이터 (90-measurement-search §3-2)", () => {
  it("모든 주소에 고친 날짜(YYYY-MM-DD)가 있다", () => {
    const catalog = new GuideCatalog([article("a-post", "published", "2026-12-01")]);
    for (const entry of sitemapEntries(catalog)) expect(entry.lastModified, entry.path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("Organization과 WebSite: 이름 · 별칭 · 주소 · 로고 · 이메일 · 공식 채널", () => {
    const [organization, website] = siteJsonLd(site, { alternateName: "Savely", email: "contact@savelyglobal.com", sameAs: ["https://blog.naver.com/savelyglobal"] });
    expect(organization).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "세이블리",
      alternateName: "Savely",
      url: "https://www.savelyglobal.com/home",
      logo: "https://www.savelyglobal.com/home/icon.png",
      email: "contact@savelyglobal.com",
      sameAs: ["https://blog.naver.com/savelyglobal"],
    });
    expect(website).toEqual({ "@context": "https://schema.org", "@type": "WebSite", name: "세이블리", alternateName: "Savely", url: "https://www.savelyglobal.com/home" });
  });
});

describe("Article 구조화 데이터 (91-content §4-7)", () => {
  const data = articleJsonLd(article("a-post", "published", "2026-12-01", "2026-12-10"), site);

  it("Google이 Article에 권장하는 칸이 있다: headline · datePublished · dateModified · author", () => {
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "a-post 제목",
      description: "a-post 설명",
      datePublished: "2026-12-01T00:00:00+09:00",
      dateModified: "2026-12-10T00:00:00+09:00",
      author: { "@type": "Organization", name: "세이블리", url: "https://www.savelyglobal.com/home" },
      publisher: { "@type": "Organization", name: "세이블리", logo: { "@type": "ImageObject", url: "https://www.savelyglobal.com/home/icon.png" } },
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://www.savelyglobal.com/home/guide/a-post" },
    });
  });

  it("날짜는 시간대가 붙은 ISO 8601이고, 주소는 모두 https 전체 주소다", () => {
    expect(String(data.datePublished)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/);
    const urls = JSON.stringify(data).match(/"(?:url|@id)":"[^"]+"/g) ?? [];
    expect(urls.length).toBeGreaterThanOrEqual(4);
    for (const u of urls) expect(u).toMatch(/:"https:\/\/www\.savelyglobal\.com\//);
  });

  it("스크립트에 넣을 글자는 다시 읽으면 같은 값이고, <를 그대로 두지 않는다", () => {
    const text = jsonLdText({ headline: "</script><b>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ headline: "</script><b>" });
  });
});

it("날짜 표기: 2026-12-01 → 2026년 12월 1일", () => {
  expect(formatGuideDate("2026-12-01")).toBe("2026년 12월 1일");
});
