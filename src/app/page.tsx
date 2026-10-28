import Image from "next/image";
import { Button } from "@/components/ui/button";

// basePath 검증용 임시 페이지 — 섹션 구현 때 교체한다
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Image src="/home/images/brand/logo-lockup-gnb@2x.png" alt="세이블리" width={136} height={36} priority />
      <h1 className="text-2xl font-bold">세이블리 — basePath 검증</h1>
      <Button>출시 알림 신청</Button>
    </main>
  );
}
