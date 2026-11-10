import { SearchX } from "lucide-react";
import Link from "next/link";
import { StateMessage } from "@/components/app/StateMessage";
import { AppButton } from "@/components/common/AppButton";
import { appContent } from "@/content/app.content";

const { notFound } = appContent;

// X3 없는 기록 안내 (§4-6, HTTP 404)
export default function RecordNotFound() {
  return (
    <StateMessage
      icon={SearchX}
      title={notFound.title}
      desc={notFound.desc}
      className="py-40"
      action={
        <AppButton asChild>
          <Link href="/app/records">{notFound.cta}</Link>
        </AppButton>
      }
    />
  );
}
