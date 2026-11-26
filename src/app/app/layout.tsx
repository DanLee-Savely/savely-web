import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AssistantRoot } from "@/components/app/assistant/AssistantRoot";
import { NoticeBand } from "@/components/app/NoticeBand";
import { Toast } from "@/components/app/Toast";
import { appContent } from "@/content/app.content";
import { RecordDate } from "@/domain/record/RecordDate";
import { clock } from "@/infrastructure/container";

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
        {/* 대화로 기록하기(80-record-assistant): 떠 있는 버튼 + 오른쪽 패널. 「오늘」은 서버가 한국 날짜로 정한다 */}
        <AssistantRoot today={RecordDate.today(clock)} />
      </Suspense>
    </div>
  );
}
