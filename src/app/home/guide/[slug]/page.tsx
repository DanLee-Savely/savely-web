import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeFunnelProvider } from "@/components/analytics/HomeFunnelProvider";
import { SiteTopBar } from "@/components/common/SiteTopBar";
import { GuideBody } from "@/components/guide/GuideBody";
import { GuideEndBox } from "@/components/guide/GuideEndBox";
import { WaitlistDialogProvider } from "@/components/interactive/WaitlistDialogProvider";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { guideCatalog } from "@/content/guide";
import { homeContent } from "@/content/home.content";
import { articleJsonLd, formatGuideDate, GUIDE_LIST_PATH, guidePath, jsonLdText } from "@/lib/guideSeo";

const { guide, footer } = homeContent;
const origin = `https://${footer.site}`;

// 게시한 글만 빌드할 때 정적으로 만든다. 여기에 없는 주소(초안 · 없는 글)는 그리지 않고 404로 답한다 (91-content §4-2 · §4-3)
export const dynamicParams = false;
export function generateStaticParams(): { slug: string }[] {
  return guideCatalog.published.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/home/guide/[slug]">): Promise<Metadata> {
  const article = guideCatalog.find((await params).slug);
  if (!article) return { robots: { index: false, follow: false } };
  const path = guidePath(article.slug);
  return {
    title: `${article.title} | ${footer.company}`,
    description: article.description,
    alternates: { canonical: path },
    openGraph: {
      title: article.title,
      description: article.description,
      url: path,
      siteName: footer.company,
      locale: "ko_KR",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
  };
}

// /home/guide/<slug> — 가이드 글 (91-content §4-4): 제목 · 날짜 · 본문 · 글 끝 안내 상자. 모바일도 지원한다
export default async function GuideArticlePage({ params }: PageProps<"/home/guide/[slug]">) {
  const article = guideCatalog.find((await params).slug);
  if (!article) notFound();
  const jsonLd = articleJsonLd(article, { origin, name: footer.company, logo: `${origin}/home/icon.png` });
  return (
    <HomeFunnelProvider guideSlug={article.slug}>
      <WaitlistDialogProvider>
        <SiteTopBar />
        <main className="flex-1 bg-sv-bg px-5 py-10 lg:py-20">
          <article className="mx-auto flex max-w-180 flex-col gap-8">
            <header className="flex flex-col items-start gap-3 break-keep">
              <Link href={GUIDE_LIST_PATH} className="inline-flex items-center gap-1 sv-text-support-13 text-sv-text-2 hover:text-sv-text">
                <ChevronLeft aria-hidden className="size-4" />
                {guide.backToList}
              </Link>
              <h1 className="sv-text-hero-34 text-sv-text">{article.title}</h1>
              <p className="sv-text-support-13 text-sv-text-3">
                <time dateTime={article.publishedAt}>{formatGuideDate(article.publishedAt)}</time>
                {article.revised && (
                  <>
                    {" · "}
                    <time dateTime={article.updatedAt}>{formatGuideDate(article.updatedAt)}</time> {guide.revised}
                  </>
                )}
              </p>
            </header>
            <GuideBody blocks={article.blocks} />
            {/* 안내 상자 문구는 대표 승인 뒤에 보인다(home.content.ts의 guide.approved) */}
            {guide.approved && <GuideEndBox />}
          </article>
        </main>
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(jsonLd) }} />
      </WaitlistDialogProvider>
    </HomeFunnelProvider>
  );
}
