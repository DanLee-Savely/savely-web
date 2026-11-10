import { DashSkeleton } from "@/components/app/DashSkeleton";

// 달력 로딩
export default function Loading() {
  return <DashSkeleton columns="xl:grid-cols-[1fr_380px]" cards={2} />;
}
