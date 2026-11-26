import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteTopBar } from "@/components/common/SiteTopBar";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { guideCatalog } from "@/content/guide";
import { homeContent } from "@/content/home.content";
import { formatGuideDate, GUIDE_LIST_PATH, guidePath } from "@/lib/guideSeo";

const { guide, footer } = homeContent;

// 게시한 글이 없으면 이 주소는 404다 — 검색에 빈 목록이 잡히지 않게 한다
export function generateMetadata(): Metadata {
  if (!guideCatalog.published.length) return { robots: { index: false, follow: false } };
  return {
    title: `${guide.title} | ${footer.company}`,
    description: guide.description,
    alternates: { canonical: GUIDE_LIST_PATH },
    openGraph: { title: guide.title, description: guide.description, url: GUIDE_LIST_PATH, siteName: footer.company, locale: "ko_KR", type: "website" },
  };
}

// /home/guide — 가이드 글 목록 (91-content §4-1). 게시한 글만, 새 글부터. 빌드할 때 정적으로 만든다
export default function GuideListPage() {
  const articles = guideCatalog.published;
  if (!articles.length) notFound();
  return (
    <>
      <SiteTopBar />
      <main className="flex-1 bg-sv-bg px-5 py-14 lg:py-24">
        <div className="mx-auto flex max-w-180 flex-col gap-8">
          <div className="flex flex-col gap-3 break-keep">
            <h1 className="sv-text-hero-34 text-sv-text">{guide.title}</h1>
            <p className="sv-text-body-15 text-sv-text-2">{guide.description}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link href={guidePath(a.slug)} className="flex flex-col gap-2 rounded-sv-lg border border-sv-border-2 bg-sv-surface p-6 break-keep hover:border-sv-accent">
                  <span className="sv-text-title-section-20 text-sv-text">{a.title}</span>
                  <span className="sv-text-body-15 text-sv-text-2">{a.description}</span>
                  <time dateTime={a.publishedAt} className="sv-text-support-13 text-sv-text-3">
                    {formatGuideDate(a.publishedAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
