"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { appContent } from "@/content/app.content";

type ToastKey = keyof typeof appContent.toast;

// 알림(S1~S4): 주소의 ?done=… 을 읽어 화면 아래 가운데에 3초 보여 주고, 주소에서 지운다
export function Toast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = params.get("done") as ToastKey | null;
  const text = key && appContent.toast[key];

  useEffect(() => {
    if (!text) return;
    const rest = new URLSearchParams(params);
    rest.delete("done");
    const timer = setTimeout(() => router.replace(rest.size ? `${pathname}?${rest}` : pathname, { scroll: false }), 3000);
    return () => clearTimeout(timer);
  }, [text, params, pathname, router]);

  if (!text) return null;
  const Icon = key === "gone" ? CircleAlert : CircleCheck;
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
