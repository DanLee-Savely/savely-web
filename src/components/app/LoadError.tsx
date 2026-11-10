"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";
import { appContent } from "@/content/app.content";
import { StateMessage } from "./StateMessage";

// X2 불러오기 오류 + 「다시 시도」(error.tsx에서 씀). 원인은 화면에 보여 주지 않는다
export function LoadError({ retry }: { retry: () => void }) {
  return (
    <StateMessage
      icon={CloudOff}
      tone="danger"
      title={appContent.list.error.title}
      action={
        <AppButton onClick={retry}>
          <RotateCw aria-hidden className="size-4" />
          {appContent.list.error.retry}
        </AppButton>
      }
    />
  );
}
