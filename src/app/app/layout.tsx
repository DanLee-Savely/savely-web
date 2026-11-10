import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app/AppSidebar";
import { NoticeBand } from "@/components/app/NoticeBand";
import { Toast } from "@/components/app/Toast";
import { appContent } from "@/content/app.content";

// /app 기록 체험판 (70-mvp-records). 공개 쓰기 화면이라 검색에서 뺀다(M12). 매 요청 D1을 읽는다
export const metadata: Metadata = { title: appContent.meta.title, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-screen flex-col bg-sv-bg lg:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1 px-5 py-7 lg:px-10">
        <NoticeBand />
        {children}
      </main>
      <Suspense>
        <Toast />
      </Suspense>
    </div>
  );
}
