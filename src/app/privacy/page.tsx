import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { homeContent } from "@/content/home.content";

const { privacy } = homeContent;

export const metadata: Metadata = { title: privacy.meta.title };

// /home/privacy — 출시 알림 신청의 실제 처리 방식과 일치해야 한다 (30-waitlist §6, 00-decisions C6 초안)
export default function PrivacyPage() {
  return (
    <>
      <header className="border-b border-sv-border bg-sv-bg px-5 py-3 lg:border-sv-border-2 lg:py-4">
        <div className="mx-auto max-w-(--sv-content-max)">
          <Link href="/" className="inline-block">
            <Logo className="h-7 lg:h-9" />
          </Link>
        </div>
      </header>
      <main className="flex-1 bg-sv-bg px-5 py-14 lg:py-24">
        <article className="mx-auto flex max-w-[720px] flex-col gap-10">
          <div className="flex flex-col items-start gap-3">
            <span className="rounded-sv-pill bg-sv-accent-tint px-3 py-1 sv-text-label-13 text-sv-accent">
              {privacy.draft}
            </span>
            <h1 className="sv-text-hero-34 text-sv-text">{privacy.title}</h1>
            <p className="sv-text-body-15 text-sv-text-2">{privacy.intro}</p>
            <p className="sv-text-support-13 text-sv-text-3">{privacy.draftNote}</p>
          </div>
          {privacy.sections.map((s) => (
            <section key={s.title} className="flex flex-col gap-3">
              <h2 className="sv-text-title-section-20 text-sv-text">{s.title}</h2>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 sv-text-body-15 text-sv-text-2">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
          <p className="sv-text-support-13 text-sv-text-3">{privacy.effective}</p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
