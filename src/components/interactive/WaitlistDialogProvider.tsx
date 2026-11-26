"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";
import { useHomeFunnel } from "@/components/analytics/HomeFunnelProvider";
import { WaitlistDialog } from "./WaitlistDialog";

type WaitlistDialogContextValue = {
  /** 열린 위치. 닫혀 있으면 null */
  source: WaitlistSource | null;
  open: (source: WaitlistSource) => void;
  close: () => void;
};

const WaitlistDialogContext = createContext<WaitlistDialogContextValue | null>(null);

// 신청 창(I8)은 다섯 곳에서 열린다 — 열림 상태와 연 위치를 공유한다
export function WaitlistDialogProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<WaitlistSource | null>(null);
  const funnel = useHomeFunnel();
  const close = () => setSource(null);
  const open = (next: WaitlistSource) => {
    funnel?.waitlistOpened(next);
    setSource(next);
  };
  return (
    <WaitlistDialogContext value={{ source, open, close }}>
      {children}
      <WaitlistDialog source={source} onClose={close} />
    </WaitlistDialogContext>
  );
}

export function useWaitlistDialog(): WaitlistDialogContextValue {
  const value = useContext(WaitlistDialogContext);
  if (!value) throw new Error("WaitlistDialogProvider 안에서만 쓸 수 있어요");
  return value;
}
