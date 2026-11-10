"use client";

import { useState } from "react";
import type { RecordActionResult } from "@/app/app/records/actions";
import type { RecordDraft, RecordField } from "@/domain/record/RecordEntry";
import { clock } from "@/infrastructure/container";
import { RecordFormFlow } from "@/interaction/RecordFormFlow";

const focus = (field: RecordField | null) => {
  const el = field && document.getElementById(`field-${field}`);
  el?.focus({ preventScroll: true });
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
};

// RecordFormFlow를 기록 폼에 연결하는 얇은 어댑터. 저장 성공이면 Action이 상세로 이동시킨다
export function useRecordForm(initial: RecordDraft, action: (data: FormData) => Promise<RecordActionResult>) {
  const [flow, setFlow] = useState(() => new RecordFormFlow(initial));

  const submit = async () => {
    const next = flow.submit(clock);
    setFlow(next);
    if (next.status !== "submitting") return focus(next.firstErrorField);
    const data = new FormData();
    for (const [k, v] of Object.entries(next.draft)) data.set(k, v);
    // 서버에 닿지 못한 경우(오프라인 등)도 저장 실패(E10)로 보여 준다
    const result = await action(data).catch((): RecordActionResult => ({ formError: "SERVER_ERROR" }));
    if (!result) return; // 성공: 이동 중이라 잠금을 유지
    const failed = next.fail(result.errors ?? {}, result.formError ?? null);
    setFlow(failed);
    focus(failed.firstErrorField);
  };

  return {
    flow,
    set: (field: keyof RecordDraft, value: string) => setFlow((f) => f.set(field, value)),
    setKind: (kind: string) => setFlow((f) => f.setKind(kind)),
    submit,
  };
}
