import { Plus } from "lucide-react";
import Link from "next/link";
import { AppButton } from "@/components/common/AppButton";
import { appContent } from "@/content/app.content";

// 목록 머리말의 「+ 기록하기」
export function CreateRecordButton() {
  return (
    <AppButton asChild>
      <Link href="/app/records/new">
        <Plus aria-hidden className="size-4" />
        {appContent.list.create}
      </Link>
    </AppButton>
  );
}
