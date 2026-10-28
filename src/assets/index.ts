import home from "./app/savely_light_01_home.png";
import recordInput from "./app/savely_light_02_record_input.png";
import calendar from "./app/savely_light_03_calendar.png";
import dayDetail from "./app/savely_light_04_day_detail.png";
import report from "./app/savely_light_05_report.png";

export { default as logoLockup } from "./brand/logo-lockup.png";
export { default as logoWordmark } from "./brand/logo-wordmark.png";

// home.content.ts의 image 파일명 → 정적 import 이미지
export const appScreens = {
  "savely_light_01_home.png": home,
  "savely_light_02_record_input.png": recordInput,
  "savely_light_03_calendar.png": calendar,
  "savely_light_04_day_detail.png": dayDetail,
  "savely_light_05_report.png": report,
} as const;
