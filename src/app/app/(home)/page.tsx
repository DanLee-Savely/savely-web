import { CreateRecordButton } from "@/components/app/CreateRecordButton";
import { PageHeader } from "@/components/app/PageHeader";
import { appContent } from "@/content/app.content";

// 홈 /app (§4-8, M2). 4단계에서 오늘 · 이번 달 · 최근 7일 · 많이 쓴 곳 카드를 채운다
// 경로 묶음 (home)에 두는 이유: app/loading.tsx를 바로 두면 기록 상세까지 감싸 404가 200이 된다
export default function HomePage() {
  return <PageHeader title={appContent.nav.home} actions={<CreateRecordButton />} />;
}
