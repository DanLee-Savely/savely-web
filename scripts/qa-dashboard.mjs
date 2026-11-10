// 미션 6 홈 · 달력 · 리포트 QA 자동 점검 (docs/spec/70-mvp-records.md §10 Q23~Q30 → 결과 docs/spec/71-mvp-qa.md)
// 준비: npm run preview(로컬 D1). 실행: node scripts/qa-dashboard.mjs <결과 폴더>
// 로컬 D1의 records를 지우고 다시 채우며 표 이름을 잠시 바꾸므로 실서비스에는 쓰지 않는다
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import fs from "node:fs";

const OUT = process.argv[2] ?? ".";
const B = "http://localhost:8787";
const R = {};
const log = (q, ok, note) => {
  R[q] = { ok, note };
  console.log(q, ok ? "PASS" : "FAIL", "-", note);
};
const d1 = (sql) => JSON.parse(execSync(`npx wrangler d1 execute savely-records --local --json --command "${sql}" 2>/dev/null`).toString())[0].results;
const d1file = (lines) => {
  fs.writeFileSync(`${OUT}/qa-dash.sql`, lines.join("\n"));
  execSync(`npx wrangler d1 execute savely-records --local --file ${OUT}/qa-dash.sql 2>/dev/null`);
};
let seq = 0;
const ins = (date, amount, over = {}) => {
  const r = { kind: "expense", category_id: "food", reason: null, feeling: null, ...over };
  const t = `${date}T00:00:${String(seq++ % 60).padStart(2, "0")}.000Z`;
  const v = (x) => (x === null ? "NULL" : `'${x}'`);
  return `INSERT INTO records (id, kind, amount, record_date, category_id, reason, feeling, created_at, updated_at) VALUES ('${crypto.randomUUID()}', '${r.kind}', ${amount}, '${date}', '${r.category_id}', ${v(r.reason)}, ${v(r.feeling)}, '${t}', '${t}');`;
};
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
const [Y, M, D] = today.split("-").map(Number);
const monthKey = today.slice(0, 7);
const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const num = (s) => Number((s.match(/[\d,]+/) ?? ["0"])[0].replace(/,/g, ""));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ko-KR" });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
const go = async (path) => {
  await page.goto(B + path);
  await page.locator("[aria-busy]").first().waitFor({ state: "detached", timeout: 8000 }).catch(() => {});
};
const h1 = () => page.locator("main h1").first().innerText();

// Q23 홈 제목: 오늘 기록 0 · 1 · 3 · 6건
const q23 = [];
for (const n of [0, 1, 3, 6]) {
  d1file(["DELETE FROM records;", ...Array.from({ length: n }, (_, i) => ins(today, 1000 + i))]);
  await go("/app");
  q23.push(`${n}건 「${await h1()}」`);
}
log("Q23", q23.join("|") === "0건 「오늘은 아직 적지 않았어요.」|1건 「오늘 한 번 적었어요.」|3건 「오늘 세 번 적었어요.」|6건 「오늘 6번 적었어요.」", q23.join(" · "));

// 예시 데이터: 이번 달 · 지난달 지출과 오늘 수입
const seed = ["DELETE FROM records;"];
for (let d = 1; d <= D; d++) seed.push(ins(`${monthKey}-${String(d).padStart(2, "0")}`, 1000 * d, { category_id: d % 3 ? "food" : "cafe", reason: d % 4 ? "need" : "impulse", feeling: d % 5 ? "meh" : "regret" }));
const prev = new Date(Date.UTC(Y, M - 2, 1)).toISOString().slice(0, 7);
for (let d = 1; d <= 20; d++) seed.push(ins(`${prev}-${String(d).padStart(2, "0")}`, 500 * d));
d1file(seed);

// Q24 같은 달 지출 합계: 홈 · 달력 · 리포트
await go("/app");
const homeSum = num(await page.locator("section", { hasText: "이번 달 쓴 돈" }).locator("p.sv-text-amount-44").innerText());
await go("/app/calendar");
const calSum = num((await page.getByText(new RegExp(`${M}월 지출`)).first().innerText()).split("지출")[1]);
await go("/app/report");
const repSum = num(await page.locator("section", { hasText: `${M}월 지출` }).locator("p.sv-text-amount-44").first().innerText());
const dbSum = d1(`SELECT SUM(amount) AS s FROM records WHERE kind='expense' AND record_date BETWEEN '${monthKey}-01' AND '${today}'`)[0].s;
log("Q24", homeSum === calSum && calSum === repSum && repSum === dbSum, `홈 ${homeSum.toLocaleString()} · 달력 ${calSum.toLocaleString()} · 리포트 ${repSum.toLocaleString()} · DB ${dbSum.toLocaleString()}`);

// Q25 수입 제외: 오늘 급여 3,000,000 추가
const cellBefore = await (async () => { await go("/app/calendar"); return page.locator(`a[href^="/app/calendar"][href$="date=${today}"]`).innerText(); })();
d1file([ins(today, 3000000, { kind: "income", category_id: "salary" })]);
await go("/app");
const income = await page.locator("section", { hasText: "이번 달 쓴 돈" }).locator("dd").first().innerText();
const homeSum2 = num(await page.locator("section", { hasText: "이번 달 쓴 돈" }).locator("p.sv-text-amount-44").innerText());
const topHasSalary = await page.locator("section", { hasText: "많이 쓴 곳" }).getByText("급여").count();
await go("/app/calendar");
const cellAfter = await page.locator(`a[href^="/app/calendar"][href$="date=${today}"]`).innerText();
await go("/app/report");
const repHasSalary = await page.locator("section", { hasText: "어디에 썼나요" }).getByText("급여").count();
log("Q25", income === "+3,000,000원" && homeSum2 === homeSum && cellBefore === cellAfter && !topHasSalary && !repHasSalary,
  `수입 줄 「${income}」 · 이번 달 쓴 돈 그대로(${homeSum2.toLocaleString()}) · 오늘 칸 「${cellAfter.replace(/\s+/g, " ")}」 그대로 · 많이 쓴 곳 · 리포트 카테고리에 급여 없음`);

// Q26 달 이동
const q26 = [];
const future = new Date(Date.UTC(Y, M, 1)).toISOString().slice(0, 7);
for (const m of ["abc", "2026-13", future]) {
  await go(`/app/calendar?month=${m}`);
  q26.push(`calendar ?month=${m} → ${await page.locator("main header span.sv-text-label-15").innerText()}`);
  await go(`/app/report?month=${m}`);
  q26.push(`report → ${await page.locator("main header span.sv-text-label-15").innerText()}`);
}
await go("/app/calendar");
const nextDisabled = await page.getByLabel("다음 달").getAttribute("aria-disabled");
await page.getByLabel("이전 달").click();
await page.waitForURL(new RegExp(`month=${prev}`));
const afterPrev = await page.locator("main header span.sv-text-label-15").innerText();
const nextLink = await page.getByRole("link", { name: "다음 달" }).getAttribute("href");
const label = `${Y}년 ${M}월`;
log("Q26", q26.every((s) => s.endsWith(label)) && nextDisabled !== null && nextLink?.endsWith(monthKey),
  `${q26.join(" / ")} · 이번 달 다음 버튼 비활성(aria-disabled) · 이전 달로 이동 「${afterPrev}」 후 다음 달 링크 ${nextLink}`);

// Q27 날짜 선택 → 이 날 기록 추가, 미래 날짜는 선택 안 됨
await go(`/app/calendar?month=${prev}`);
const pick = `${prev}-05`;
await page.locator(`a[href^="/app/calendar"][href$="date=${pick}"]`).click();
await page.waitForURL(new RegExp(`date=${pick}`));
const panelDate = await page.locator("section h2.sv-text-title-section-20").innerText();
await page.getByRole("link", { name: "이 날 기록 추가" }).click();
await page.locator("#field-date").waitFor();
const formDate = await page.inputValue("#field-date");
await go("/app/calendar");
const futureDate = addDays(today, 1);
const futureLinks = futureDate.startsWith(monthKey) ? await page.locator(`a[href^="/app/calendar"][href$="date=${futureDate}"]`).count() : 0;
const futureCell = futureDate.startsWith(monthKey) ? await page.locator('span[aria-disabled]', { hasText: String(Number(futureDate.slice(8))) }).count() : "다음 달이라 해당 없음";
await go(`/app/calendar?date=${futureDate}`);
const futureSel = await page.locator("section h2.sv-text-title-section-20").innerText();
log("Q27", formDate === pick && futureLinks === 0, `${pick} 선택 → 패널 「${panelDate}」 → 등록 날짜 ${formDate} · 내일(${futureDate}) 칸 링크 ${futureLinks}개(누를 수 없는 칸 ${futureCell}) · ?date=내일 → 선택 「${futureSel}」(오늘)`);

// Q28 주 구간: 28 · 30 · 31일인 달 (한 건씩 넣어 빈 달이 아니게)
d1file([ins("2026-02-10", 1000), ins("2026-04-10", 1000), ins("2026-01-10", 1000)]);
const q28 = [];
for (const m of ["2026-02", "2026-04", "2026-01"]) {
  await go(`/app/report?month=${m}`);
  const labels = await page.locator("section", { hasText: "주별 지출" }).locator("ol > li > span:nth-child(3)").allInnerTexts();
  q28.push(`${m}: ${labels.length}구간(${labels.at(-1)})`);
}
log("Q28", q28.join("|") === "2026-02: 4구간(22–28일)|2026-04: 5구간(29–30일)|2026-01: 5구간(29–31일)", q28.join(" · "));
await page.screenshot({ path: `${OUT}/qa-q28-report.png`, fullPage: true });

// Q29 빈 상태
d1("DELETE FROM records");
await go("/app");
const h3 = await page.getByText("한 건만 적어도 오늘이 시작됩니다").count();
const h5 = await page.getByText("기록이 쌓이면 많이 쓴 곳을 보여 드려요").count();
await page.screenshot({ path: `${OUT}/qa-q29-home.png` });
await go("/app/calendar");
const c2 = await page.getByText("이 날은 기록이 없어요").count();
await go("/app/report");
const r5 = await page.getByText("이 달은 기록이 없어요").count();
log("Q29", h3 && h5 && c2 && r5, `홈 H3 ${h3 ? "표시" : "없음"} · H5 ${h5 ? "표시" : "없음"} · 달력 C2 ${c2 ? "표시" : "없음"} · 리포트 R5 ${r5 ? "표시" : "없음"}`);

// Q30 오늘 기준: 서버 화면의 「오늘」 = 한국 날짜
await go("/app");
const eyebrow = await page.locator("main header p.sv-text-eyebrow-12_5").innerText();
await go("/app/calendar");
const todayCell = await page.locator("a", { hasText: "오늘" }).getAttribute("href");
const kst = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" }).format(new Date());
log("Q30", eyebrow === kst && todayCell?.endsWith(`date=${today}`),
  `지금 UTC ${new Date().toISOString().slice(0, 16)} · 한국 ${today} → 홈 「${eyebrow}」 · 달력 오늘 칸 ${todayCell?.split("date=")[1]} · 0~9시 경계는 MonthKey 단위 테스트(UTC 10-31 15:30 → 한국 11-01)`);

// 덧붙임: 세 화면의 오류 · 로딩
d1("ALTER TABLE records RENAME TO records_x");
const x2 = [];
for (const p of ["/app", "/app/calendar", "/app/report"]) {
  await go(p);
  x2.push(`${p} ${(await page.getByText("기록을 불러오지 못했어요").count()) ? "X2" : "?"}`);
}
d1("ALTER TABLE records_x RENAME TO records");
log("X", x2.every((s) => s.endsWith("X2")), `표 이름을 바꿔 조회 실패 → ${x2.join(" · ")}`);

console.log("page errors:", errs);
fs.writeFileSync(`${OUT}/qa-dash-result.json`, JSON.stringify(R, null, 2));
await browser.close();
