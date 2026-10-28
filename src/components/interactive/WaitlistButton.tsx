"use client";

import type { ComponentProps } from "react";
import { AppButton } from "@/components/common/AppButton";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";
import { useWaitlistDialog } from "./WaitlistDialogProvider";

type WaitlistButtonProps = Omit<ComponentProps<typeof AppButton>, "onClick"> & { source: WaitlistSource };

// 출시 알림 신청 창을 여는 버튼 (GNB · 히어로 · 마지막 CTA · 떠 있는 CTA)
export function WaitlistButton({ source, ...props }: WaitlistButtonProps) {
  const { open } = useWaitlistDialog();
  return <AppButton onClick={() => open(source)} {...props} />;
}
