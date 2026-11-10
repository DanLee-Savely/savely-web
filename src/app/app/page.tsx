import { redirect } from "next/navigation";

// /app 첫 화면은 기록 목록 (M2)
export default function AppPage() {
  redirect("/app/records");
}
