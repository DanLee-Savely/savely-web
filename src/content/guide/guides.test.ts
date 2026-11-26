import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { homeContent } from "@/content/home.content";
import { GuideArticle } from "@/domain/guide/GuideArticle";
import { FORBIDDEN_WORDS } from "@/lib/copyRules";
import { sitemapEntries } from "@/lib/guideSeo";
import { guideCatalog, guideSources } from "./index";

// 실제 원고(src/content/guide/*.md) 점검 (91-content §3 · §4). 파일은 테스트에서만 읽는다 — 사이트는 빌드할 때 묶인 글자를 쓴다
const dir = fileURLToPath(new URL(".", import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

describe("가이드 원고", () => {
  it("폴더의 원고가 빠짐없이 등록돼 있고, 등록한 글자가 파일과 같다", () => {
    expect(Object.keys(guideSources).sort().map((slug) => `${slug}.md`)).toEqual(files);
    for (const file of files) expect(guideSources[file.replace(/\.md$/, "")], file).toBe(readFileSync(`${dir}${file}`, "utf8"));
  });

  it("모든 원고가 형식에 맞고, 파일 이름과 slug가 같다", () => {
    for (const [slug, source] of Object.entries(guideSources)) expect(GuideArticle.parse(source).slug).toBe(slug);
  });

  it("금지 표현이 없다(문구 규칙)", () => {
    for (const [slug, source] of Object.entries(guideSources)) expect(source.match(FORBIDDEN_WORDS)?.[0], slug).toBeUndefined();
  });

  it("게시한 글이 있으면 가이드 문구(안내 상자 · 링크 이름)가 승인된 상태여야 한다", () => {
    if (guideCatalog.published.length) expect(homeContent.guide.approved).toBe(true);
  });

  it("첫 원고 gagyebu-habit은 대표 승인 전이라 초안이다 — 목록 · 사이트맵 · 글 주소 어디에도 나오지 않는다", () => {
    const first = GuideArticle.parse(guideSources["gagyebu-habit"]);
    expect(first).toMatchObject({ status: "draft", publishedAt: "게시일", updatedAt: "게시일" });
    expect(guideCatalog.find("gagyebu-habit")).toBeNull();
    expect(guideCatalog.published.map((a) => a.slug)).not.toContain("gagyebu-habit");
    expect(sitemapEntries(guideCatalog).map((e) => e.path).filter((p) => p.includes("gagyebu-habit"))).toEqual([]);
  });
});
