"use client";

import { createContext, type ReactNode, useContext } from "react";
import { type Assistant, useAssistant } from "@/hooks/useAssistant";

type AssistantContextValue = { assistant: Assistant; today: string };
const AssistantContext = createContext<AssistantContextValue | null>(null);

// 「대화로 기록하기」 패널의 상태를 /app 화면 전체가 함께 쓴다(80 E1~E5).
// 홈의 버튼 · 입력칸 · 예시 칩, 기록하기 폼의 「대화로 적기」, 오른쪽 아래 버튼이 모두 같은 패널을 연다.
// 「오늘」은 서버가 한국 날짜로 정해 넘긴다
export function AssistantProvider({ today, children }: { today: string; children: ReactNode }) {
  const assistant = useAssistant(today);
  return <AssistantContext.Provider value={{ assistant, today }}>{children}</AssistantContext.Provider>;
}

export function useAssistantContext(): AssistantContextValue {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("AssistantProvider 안에서만 쓴다");
  return value;
}
