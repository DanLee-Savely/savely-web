import { CreateRecordButton } from "@/components/app/CreateRecordButton";
import { Last7Card, MonthCard, TodayCard, TopCategoriesCard } from "@/components/app/HomeCards";
import { PageHeader } from "@/components/app/PageHeader";
import { appContent, countWord, fill } from "@/content/app.content";
import { createRecordsServer } from "@/infrastructure/container";
import { formatDay } from "@/lib/recordFormat";

const { home } = appContent;

// 홈 /app (§4-8, M2): 기록만 읽어 오늘 · 이번 달 · 최근 7일 · 많이 쓴 곳. 「오늘」은 한국 날짜
// 경로 묶음 (home)에 두는 이유: app/loading.tsx를 바로 두면 기록 상세까지 감싸 404가 200이 된다
export default async function HomePage() {
  const s = await (await createRecordsServer()).home.execute();
  return (
    <>
      <PageHeader
        eyebrow={formatDay(s.today)}
        title={s.todayCount ? fill(home.titleCount, { n: countWord(s.todayCount) }) : home.titleZero}
        actions={<CreateRecordButton />}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <TodayCard s={s} />
        <MonthCard s={s} />
        <Last7Card s={s} />
        <TopCategoriesCard s={s} />
      </div>
    </>
  );
}
