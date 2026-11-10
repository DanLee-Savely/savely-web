// 기록 화면 표시 형식. 날짜 문자열은 Date로 해석하지 않고 숫자로 나눠 UTC 자정으로 만든다(하루 밀림 방지, 70-mvp-records §8-4)
const DAY = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "UTC" });
const TIME = new Intl.DateTimeFormat("ko-KR", {
  month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Seoul",
});

/** '2026-10-26' → 「10월 26일 (월)」 */
export const formatDay = (date: string): string => {
  const [y, m, d] = date.split("-").map(Number);
  return DAY.format(Date.UTC(y, m - 1, d));
};

const DAY_SHORT = new Intl.DateTimeFormat("ko-KR", { day: "numeric", weekday: "short", timeZone: "UTC" });

/** '2026-10-20' → 「20일 (화)」 */
export const formatDayShort = (date: string): string => {
  const [y, m, d] = date.split("-").map(Number);
  return DAY_SHORT.format(Date.UTC(y, m - 1, d));
};

/** ISO 시각 → 「10월 26일 14:12」(한국 시간) */
export const formatTime = (iso: string): string => TIME.format(new Date(iso));

/** 9000 → 「9,000」 */
export const formatAmount = (n: number): string => n.toLocaleString("ko-KR");

/** 사진 주소(/app/records/[id]/image), 없으면 null. 사진을 바꾸면 키가 바뀌므로 v로 붙여 이전 사진이 보이지 않게 한다 */
export const imageUrl = (r: { id: string; imageKey: string | null }): string | null =>
  r.imageKey && `/app/records/${r.id}/image?v=${r.imageKey.split("/")[1]}`;
