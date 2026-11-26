import { describe, expect, it } from "vitest";
import { DomainError } from "../DomainError";
import { GuideArticle } from "./GuideArticle";
import { GuideCatalog } from "./GuideCatalog";
import { GuideMarkdown } from "./GuideMarkdown";

// 가이드 글 (91-content §4): 원고 읽기 · draft/published · 본문 문법
const source = (over: Record<string, string> = {}, body = "첫 문단이에요.\n\n## 소제목\n\n둘째 문단이에요.") => {
  const meta = { title: "제목 — 부제", description: "설명문이에요.", slug: "sample-post", status: "published", publishedAt: "2026-12-01", updatedAt: "2026-12-01", ...over };
  return `---\n${Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n\n${body}\n`;
};
const code = (fn: () => unknown) => DomainError.codeOf(fn);

describe("GuideArticle — 머리말", () => {
  it("머리말과 본문을 읽는다. 제목의 글자는 그대로 둔다", () => {
    const a = GuideArticle.parse(source());
    expect(a).toMatchObject({ slug: "sample-post", title: "제목 — 부제", description: "설명문이에요.", status: "published", publishedAt: "2026-12-01", published: true, revised: false });
    expect(a.blocks.map((b) => b.type)).toEqual(["paragraph", "heading", "paragraph"]);
  });

  it("상태 · 날짜 뒤의 설명(# …)은 뗀다 — 명세의 머리말 예시 그대로", () => {
    const a = GuideArticle.parse(source({ status: "draft        # draft | published" }));
    expect(a).toMatchObject({ status: "draft", published: false });
  });

  it("초안은 날짜 자리가 비어 있어도 된다(「게시일」). 게시하는 글은 달력에 있는 날짜여야 한다", () => {
    expect(GuideArticle.parse(source({ status: "draft", publishedAt: "게시일", updatedAt: "게시일" })).published).toBe(false);
    expect(code(() => GuideArticle.parse(source({ publishedAt: "게시일", updatedAt: "게시일" })))).toBe("INVALID_DATE");
    expect(code(() => GuideArticle.parse(source({ publishedAt: "2026-02-30", updatedAt: "2026-02-30" })))).toBe("INVALID_DATE");
    expect(code(() => GuideArticle.parse(source({ publishedAt: "2026-12-08", updatedAt: "2026-12-01" })))).toBe("INVALID_DATE");
    expect(GuideArticle.parse(source({ updatedAt: "2026-12-08" })).revised).toBe(true);
  });

  it("빠진 칸 · 틀린 slug · 틀린 상태 · 머리말 없음 · 빈 본문은 거부한다", () => {
    expect(code(() => GuideArticle.parse(source({ description: "" })))).toBe("MISSING_FIELD");
    expect(code(() => GuideArticle.parse(source({ slug: "Sample_Post" })))).toBe("INVALID_SLUG");
    expect(code(() => GuideArticle.parse(source({ status: "public" })))).toBe("INVALID_STATUS");
    expect(code(() => GuideArticle.parse("제목만 있는 글"))).toBe("MISSING_FRONT_MATTER");
    expect(code(() => GuideArticle.parse(source({}, "")))).toBe("EMPTY_BODY");
  });
});

describe("GuideMarkdown — 본문", () => {
  it("소제목 · 문단 · 목록을 블록으로 읽는다. 이어진 줄은 한 문단이다", () => {
    const blocks = GuideMarkdown.parse("첫 줄\n둘째 줄\n\n## 큰 소제목\n### 작은 소제목\n\n- 하나\n- 둘\n\n1. 첫째\n2. 둘째");
    expect(blocks).toEqual([
      { type: "paragraph", inlines: [{ type: "text", text: "첫 줄 둘째 줄" }] },
      { type: "heading", level: 2, inlines: [{ type: "text", text: "큰 소제목" }] },
      { type: "heading", level: 3, inlines: [{ type: "text", text: "작은 소제목" }] },
      { type: "list", ordered: false, items: [[{ type: "text", text: "하나" }], [{ type: "text", text: "둘" }]] },
      { type: "list", ordered: true, items: [[{ type: "text", text: "첫째" }], [{ type: "text", text: "둘째" }]] },
    ]);
  });

  it("굵게와 링크를 읽는다", () => {
    expect(GuideMarkdown.parse("앞 **굵게** 가운데 [소개](/home) 뒤")[0]).toEqual({
      type: "paragraph",
      inlines: [{ type: "text", text: "앞 " }, { type: "strong", text: "굵게" }, { type: "text", text: " 가운데 " }, { type: "link", text: "소개", href: "/home" }, { type: "text", text: " 뒤" }],
    });
  });

  it("지원하지 않는 문법은 기호째 내보내지 않고 멈춘다", () => {
    for (const body of ["# 큰 제목", "#### 너무 작은 제목", "> 인용", "```\n코드\n```", "| 표 | 칸 |", "![그림](/a.png)", "<b>태그</b>", "---", "* 별표 목록", "짝이 안 맞는 **굵게", "코드 `조각`"]) {
      expect(code(() => GuideMarkdown.parse(body)), body).toBe("UNSUPPORTED_SYNTAX");
    }
  });

  it("링크는 사이트 안 경로나 https 주소만 받는다. 사이트 안 링크에는 UTM을 붙이지 못한다", () => {
    expect(code(() => GuideMarkdown.parse("[위험](javascript:alert(1))"))).not.toBeNull();
    expect(code(() => GuideMarkdown.parse("[http](http://example.com)"))).toBe("INVALID_LINK");
    expect(code(() => GuideMarkdown.parse("[다른 곳](//example.com)"))).toBe("INVALID_LINK");
    expect(code(() => GuideMarkdown.parse("[소개](/home?utm_source=guide)"))).toBe("UTM_ON_INTERNAL_LINK");
    expect(code(() => GuideMarkdown.parse("[소개](https://www.savelyglobal.com/home?a=1&utm_medium=x)"))).toBe("UTM_ON_INTERNAL_LINK");
    expect(code(() => GuideMarkdown.parse("[출처](https://example.com/report?utm_source=x)"))).toBeNull();
  });
});

describe("GuideCatalog — 게시한 글만 내보낸다", () => {
  const draft = GuideArticle.parse(source({ slug: "draft-post", status: "draft", publishedAt: "게시일", updatedAt: "게시일" }));
  const older = GuideArticle.parse(source({ slug: "older", publishedAt: "2026-12-01", updatedAt: "2026-12-01" }));
  const newer = GuideArticle.parse(source({ slug: "newer", publishedAt: "2026-12-08", updatedAt: "2026-12-08" }));
  const catalog = new GuideCatalog([older, draft, newer]);

  it("목록에는 게시한 글만, 새 글부터 나온다", () => {
    expect(catalog.published.map((a) => a.slug)).toEqual(["newer", "older"]);
  });

  it("초안과 없는 글은 찾지 못한다 — 화면은 404로 답한다", () => {
    expect(catalog.find("older")?.slug).toBe("older");
    expect(catalog.find("draft-post")).toBeNull();
    expect(catalog.find("nope")).toBeNull();
  });

  it("같은 slug가 두 번 있으면 거부한다", () => {
    expect(code(() => new GuideCatalog([older, older]))).toBe("DUPLICATE_SLUG");
  });
});
