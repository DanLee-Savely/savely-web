"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { appContent } from "@/content/app.content";

type ToastKey = keyof typeof appContent.toast;

// 알림(S1~S4): 주소의 ?done=… 을 읽어 화면 아래 가운데에 3초 보여 준다
// 주소의 done은 바로 지운다 — router.replace는 페이지를 다시 그려 열린 확인 창이 닫히므로 history.replaceState를 쓴다
export function Toast() {
  const done = useSearchParams().get("done") as ToastKey | null;
  const [shown, setShown] = useState(done);
  const [seen, setSeen] = useState(done);
  if (done !== seen) {
    setSeen(done);
    if (done) setShown(done);
  }

  useEffect(() => {
    if (!done) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("done");
    window.history.replaceState(window.history.state, "", url);
  }, [done]);

  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => setShown(null), 3000);
    return () => clearTimeout(timer);
  }, [shown]);

  const text = shown && appContent.toast[shown];
  if (!text) return null;
  const Icon = shown === "gone" ? CircleAlert : CircleCheck;
  return (
    <p
      role="status"
      className="fixed bottom-10 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-sv-pill bg-sv-text px-5 py-3 sv-text-label-15 text-sv-surface shadow-sv-float"
    >
      <Icon aria-hidden className="size-5 text-sv-accent [&>circle]:fill-sv-on-accent" />
      {text}
    </p>
  );
}
