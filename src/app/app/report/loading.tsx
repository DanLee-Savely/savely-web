import { DashSkeleton } from "@/components/app/DashSkeleton";

// 리포트 로딩
export default function Loading() {
  return <DashSkeleton columns="xl:grid-cols-2" />;
}
