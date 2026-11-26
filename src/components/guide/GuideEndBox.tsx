import { DemoLink } from "@/components/analytics/HomeFunnelProvider";
import { AppButton } from "@/components/common/AppButton";
import { WaitlistButton } from "@/components/interactive/WaitlistButton";
import { homeContent } from "@/content/home.content";

const { endBox } = homeContent.guide;

// 글 끝 안내 상자 (91-content §4-5): 세이블리 한 줄 소개 + 「출시 알림 신청」(신청 위치 guide) + PC만 「웹에서 체험하기」.
// 체험판은 PC 전용이라 모바일에서는 링크를 숨긴다(M16). 사이트 안 링크라 UTM을 붙이지 않는다(§4-10).
// 측정(91 §4-6): 버튼은 기존 이벤트를 쓴다 — waitlist_open · generate_lead(source=guide), demo_click(placement=guide).
// 어느 글인지(guide_slug)는 이 화면을 감싼 HomeFunnelProvider가 함께 싣는다
export function GuideEndBox() {
  return (
    <aside className="flex flex-col items-start gap-5 rounded-sv-lg bg-sv-accent-tint p-6 lg:p-8">
      <div className="flex flex-col gap-2 break-keep">
        <p className="sv-text-title-section-20 text-sv-text">{endBox.title}</p>
        <p className="sv-text-body-15 text-sv-text-2">{endBox.desc}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <WaitlistButton source="guide">{endBox.cta}</WaitlistButton>
        <AppButton asChild variant="outline" className="hidden lg:inline-flex">
          <DemoLink placement="guide" href={endBox.demo.href}>{endBox.demo.label}</DemoLink>
        </AppButton>
      </div>
    </aside>
  );
}
