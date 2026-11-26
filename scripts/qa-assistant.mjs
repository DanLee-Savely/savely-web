// 기록 종류 4가지 · 대화로 기록하기 QA 자동 점검 (docs/spec/80-record-assistant.md §11 → 결과 docs/spec/71-mvp-qa.md Q31~Q44)
// 준비: npm run preview(로컬 D1). 실행: node scripts/qa-assistant.mjs <결과 폴더> [preview 로그 파일]
// 로컬 D1의 records · cards · recurring_items를 지우고 시작하므로 실서비스에는 쓰지 않는다.
// Q39는 로컬에 OPENAI_API_KEY(.dev.vars)가 있으면 OpenAI를 실제로 한 번 부른다(없으면 규칙 결과만 확인한다)
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import fs from "node:fs";

const OUT = process.argv[2] ?? ".";
const SERVER_LOG = process.argv[3];
const B = "http://localhost:8787";
const R = {};
const log = (q, ok, note) => {
  R[q] = { ok, note };
  console.log(q, ok ? "PASS" : "FAIL", "-", note);
};
const d1 = (sql) => JSON.parse(execSync(`npx wrangler d1 execute savely-records --local --json --command "${sql}" 2>/dev/null`).toString())[0].results;
const count = (where = "1=1") => d1(`SELECT COUNT(*) AS n FROM records WHERE ${where}`)[0].n;
const sum = (where) => d1(`SELECT COALESCE(SUM(amount),0) AS s FROM records WHERE ${where}`)[0].s;
const won = (n) => n.toLocaleString("ko-KR");
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const month = today.slice(0, 7);
const monthRange = `record_date BETWEEN '${month}-01' AND '${today}'`;

// 요청 제한은 벽시계 1분 단위 고정 창이다 — 쓰기(1분 10회) · 문장 보내기(1분 20회)를 넘기 전에 다음 창을 기다린다
const windows = { write: { used: 0, limit: 9, start: Date.now() }, send: { used: 0, limit: 18, start: Date.now() } };
const budget = async (kind, n = 1) => {
  const w = windows[kind];
  if (w.used + n > w.limit) {
    const wait = Math.max(0, 61000 - (Date.now() - w.start));
    console.log(`  (${kind === "write" ? "쓰기" : "문장 보내기"} 요청 제한 창 대기 ${Math.ceil(wait / 1000)}초)`);
    await new Promise((r) => setTimeout(r, wait));
    w.used = 0;
    w.start = Date.now();
  }
  w.used += n;
};

d1("DELETE FROM records; DELETE FROM cards; DELETE FROM recurring_items");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ko-KR" });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
// Q43: 브라우저가 받는 응답 전체에서 OpenAI 주소 · 키 이름 · 모델 이름 · 프롬프트 조각을 찾는다
const needles = ["api.openai.com", "OPENAI_API_KEY", "OPENAI_MODEL", "gpt-6-luna", "json_schema", "sk-proj", "ASSISTANT_RATE_LIMITER"];
const leaks = new Map();
const urls = new Set();
page.on("response", async (r) => {
  if (!r.url().startsWith(B)) return;
  urls.add(r.url());
  try {
    const t = await r.text();
    for (const n of needles) if (t.includes(n)) leaks.set(n, r.url().replace(B, ""));
  } catch {}
});

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const newForm = async () => {
  await page.goto(`${B}/app/records/new`);
  await page.locator("#field-amount").waitFor();
};
const chip = (name) => page.getByRole("button", { name, exact: true }).click();
const created = async () => {
  await page.getByText("기록했어요").waitFor();
  return page.url().match(/records\/([0-9a-f-]{36})/)[1];
};
const saveForm = async () => {
  await budget("write");
  await page.getByRole("button", { name: "저장하기" }).click();
  return created();
};
/** 화면 본문 글자. 본문은 나눠서 도착하므로(Suspense) 요청이 잦아든 뒤에 읽는다 */
const mainText = async (path) => {
  await page.goto(B + path, { waitUntil: "networkidle" });
  return (await page.locator("main").innerText()).replace(/\s+/g, " ");
};
const row = (id) => d1(`SELECT kind, amount, category_id, payment_method, card_name, reason, feeling FROM records WHERE id='${id}'`)[0];

// ── 기록 종류 4가지 · 카테고리 선택 사항 · 카드 이름 ─────────────────────────────

// Q31 상환 · 저축 등록
await newForm();
await page.fill("#field-amount", "500000");
await chip("현금"); // 지출 전용 칸을 고른 뒤 구분을 바꾼다
await page.getByRole("button", { name: "상환", exact: true }).click();
const hidden31 = (await page.getByText("지출 정보").count()) === 0;
await chip("카드값 상환");
const transfer = row(await saveForm());
await newForm();
await page.fill("#field-amount", "300000");
await page.getByRole("button", { name: "저축", exact: true }).click();
await chip("예적금");
const savings = row(await saveForm());
await shot("qa-q31");
log(
  "Q31",
  hidden31 && transfer.kind === "transfer" && transfer.category_id === "card_bill" && transfer.payment_method === null && savings.kind === "savings" && savings.category_id === "savings_deposit",
  `상환으로 바꾸면 지출 정보 칸 ${hidden31 ? "숨김" : "보임"} · DB ${JSON.stringify(transfer)} · ${JSON.stringify(savings)}`,
);

// Q32 카테고리 없이 저장 → 리포트에서는 「기타」에 합친다
await newForm();
await page.fill("#field-amount", "4500");
const id32 = await saveForm();
const row32 = row(id32);
const report32 = await mainText(`/app/report?month=${month}`);
log("Q32", row32.category_id === null && /기타 \d+% 4,500원/.test(report32), `금액만 적고 저장 → DB category_id ${row32.category_id} · 리포트 「어디에 썼나요」에 ${report32.match(/기타 \d+% 4,500원/)?.[0] ?? "없음"}`);

// Q33 카드 이름: 카드 결제일 때만 칸이 보이고, 20자까지
await newForm();
await page.fill("#field-amount", "12000");
await chip("식비");
const noCard = await page.locator("#field-cardName").count();
await chip("현금");
const cashCard = await page.locator("#field-cardName").count();
await chip("신용카드");
await page.fill("#field-cardName", "가".repeat(21));
await page.getByRole("button", { name: "저장하기" }).click();
const err33 = await page.locator("#field-cardName-error").innerText().catch(() => "");
await page.fill("#field-cardName", "삼성카드");
const id33 = await saveForm();
const row33 = row(id33);
await page.goto(`${B}/app/records`);
const list33 = (await page.locator("ul:not([aria-busy]) > li").first().innerText()).replace(/\n+/g, " ");
log(
  "Q33",
  noCard === 0 && cashCard === 0 && err33 !== "" && row33.card_name === "삼성카드" && list33.includes("신용카드 삼성카드"),
  `결제수단 없음 · 현금일 때 카드 이름 칸 ${noCard + cashCard}개 · 21자 → 「${err33}」 · DB card_name ${row33.card_name} · 목록 「${list33}」`,
);

// Q34 숫자 기준: 지출 합계에는 지출만, 「기록 n건」은 4종 모두
d1(`INSERT INTO records (id, kind, amount, record_date, category_id, title, created_at, updated_at) VALUES ('${crypto.randomUUID()}', 'income', 3000000, '${today}', 'salary', '월급', '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z')`);
const expense34 = sum(`kind='expense' AND ${monthRange}`);
const report34 = await mainText(`/app/report?month=${month}`);
const home34 = await mainText("/app");
await shot("qa-q34-home");
const all34 = count(monthRange);
log(
  "Q34",
  report34.includes(`지출 ${won(expense34)}원`) && report34.includes("수입 +3,000,000원") && report34.includes(`기록 ${all34}건`) && home34.includes(won(expense34)),
  `DB 지출 ${won(expense34)}원(상환 500,000 · 저축 300,000 · 수입 3,000,000 제외) · 전체 ${all34}건 → 리포트 「${report34.match(/\d+월 지출 [\d,]+원 수입 \+[\d,]+원/)?.[0] ?? "?"}」 · 「${report34.match(/기록 \d+건/)?.[0] ?? "?"}」 · 홈 「${home34.match(/이번 달 쓴 돈 [\d,]+ ?원?/)?.[0] ?? (home34.includes(won(expense34)) ? won(expense34) : "?")}」`,
);

// ── 대화로 기록하기 ─────────────────────────────────────────────────

const panel = page.locator("aside[aria-label='대화로 기록하기']");
const open = async (url = "/app") => {
  await page.goto(B + url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "대화로 기록하기" }).click();
  await panel.waitFor();
  await page.waitForTimeout(1200); // 진입 블록(채우지 않은 기록 · 고정지출 질문)이 뜰 시간
};
const later = async () => {
  const b = panel.getByRole("button", { name: "나중에 할게요" });
  if (await b.count()) await b.first().click();
};
const close = async () => {
  await panel.getByRole("button", { name: "닫기" }).first().click();
  const leave = page.getByRole("button", { name: "나가기" });
  if (await leave.count()) await leave.click();
  await panel.waitFor({ state: "detached" });
};
const send = async (text) => {
  await budget("send");
  await panel.locator("textarea").fill(text);
  await panel.getByRole("button", { name: "보내기" }).click();
  await panel.getByText("정리하고 있어요…").waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(350);
};
/** 대화 영역의 마지막 블록 글자 */
const last = async () => (await panel.locator("div.overflow-y-auto > *").evaluateAll((els) => els.filter((e) => e.innerText?.trim()).at(-1)?.innerText ?? "")).replace(/\s+/g, " ");
const panelText = async () => (await panel.innerText()).replace(/\s+/g, " ");
const saveCards = async () => {
  await budget("write");
  await panel.getByRole("button", { name: /건 저장하기/ }).click();
  await page.getByRole("button", { name: "확인" }).click();
  await panel.getByText(/건을 저장했어요/).last().waitFor();
};

// Q35 첫 방문 진입 블록 · 문장 → 초안 카드 → 저장
await open();
const entry35 = await panelText();
await later();
const c35 = count();
await send("점심 9천원, 커피 4500원");
const cards35 = await panel.locator("ul > li").count();
const text35 = await panelText();
await shot("qa-q35-drafts");
await saveCards();
const saved35 = d1("SELECT title, amount, category_id, record_date FROM records ORDER BY created_at DESC LIMIT 2");
log(
  "Q35",
  entry35.includes("아직 채우지 않은 기록이 1건 있어요") && cards35 === 2 && text35.includes("2건으로 정리했어요") && count() === c35 + 2 && saved35.every((r) => r.record_date === today) && saved35.map((r) => r.amount).sort().join() === "4500,9000",
  `열면 「아직 채우지 않은 기록이 1건 있어요」(Q32의 기록) · 「점심 9천원, 커피 4500원」 → 카드 ${cards35}장 → 저장 ${count() - c35}건 ${JSON.stringify(saved35.map((r) => [r.title, r.amount, r.category_id]))}`,
);

// Q36 날짜 읽기: 다른 날의 카드는 그 날짜로 저장하고, 미래 날짜는 뺀다
await send("어제 택시 12000원");
await send("내일 커피 4500원");
const future36 = await last();
await send("버스 1500원");
const c36 = count();
await saveCards();
const dates36 = d1("SELECT title, record_date FROM records ORDER BY created_at DESC LIMIT 2").map((r) => `${r.title} ${r.record_date}`).sort();
const summary36 = await last();
log(
  "Q36",
  future36.includes("오늘보다 뒤이거나") && count() === c36 + 2 && dates36.join() === [`버스 ${today}`, `택시 ${addDays(today, -1)}`].join(),
  `「내일 커피 4500원」 → 「${future36.slice(0, 40)}…」(카드 없음) · 「어제 택시」 · 「버스」 저장 → ${dates36.join(" · ")} · 요약 「${summary36.slice(0, 60)}」`,
);

// Q37 20건을 한 번에 저장 = 쓰기 요청 1회(1분 10회 제한에 걸리지 않는다), 21번째 항목은 안내
const many = Array.from({ length: 21 }, (_, i) => `커피 ${1001 + i}원`).join(", ");
await send(many);
const cards37 = Number((await panel.getByRole("button", { name: /건 저장하기/ }).innerText()).match(/\d+/)[0]);
const note37 = (await panelText()).includes("한 번에 20건까지 정리할 수 있어요");
const c37 = count();
await saveCards();
log("Q37", cards37 === 20 && note37 && count() === c37 + 20, `21건 문장 → 카드 ${cards37}장 + 「한 번에 20건까지…」 안내 ${note37 ? "표시" : "없음"} · 저장 확인 한 번에 ${count() - c37}건 저장`);

// Q38 카드를 고쳐서 저장 · 저장하지 않고 닫으면 묻는다
await send("김밥 3500원");
await panel.locator("ul > li").last().getByRole("button").first().click();
await panel.getByText("항목 수정").waitFor();
await panel.locator("input[inputmode='numeric']").first().fill("4000");
await panel.getByRole("button", { name: "적용" }).click();
await page.waitForTimeout(300);
const edited38 = (await panel.locator("ul > li").last().innerText()).replace(/\s+/g, " ");
await panel.getByRole("button", { name: "닫기" }).first().click();
const asked38 = await page.getByText("작성 중인 기록을 지울까요?").count();
await shot("qa-q38-leave");
await page.getByRole("button", { name: "계속 작성" }).click();
const kept38 = await panel.getByRole("button", { name: /건 저장하기/ }).waitFor({ timeout: 5000 }).then(() => 1).catch(() => 0);
const c38 = count();
await close();
log("Q38", edited38.includes("4,000원") && asked38 === 1 && kept38 === 1 && count() === c38, `수정 시트에서 금액 변경 → 카드 「${edited38.slice(0, 30)}」 · 닫기 → 「작성 중인 기록을 지울까요?」 · 「계속 작성」이면 카드 유지 · 「나가기」면 저장 안 됨(${c38}→${count()}건)`);

// Q39 읽지 못한 부분만 OpenAI: 카테고리를 찾지 못한 항목 → 「AI가 정리」 표시(키가 없으면 규칙 결과만)
await open();
await later();
await send("우산 3만원"); // 「우산」은 낱말 사전에 없다 — 규칙은 카테고리를 비워 두고, 그 내용만 OpenAI에 묻는다
const card39 = (await panel.locator("ul > li").last().innerText()).replace(/\s+/g, " ");
const ai39 = card39.includes("AI가 정리");
await shot("qa-q39-ai");
await panel.getByRole("button", { name: "카드 지우기" }).first().click();
log("Q39", card39.includes("30,000원"), `「우산 3만원」 → 카드 「${card39.slice(0, 50)}」 · ${ai39 ? "OpenAI가 카테고리를 채움(「AI가 정리」 표시)" : "「AI가 정리」 표시 없음 — 키가 없거나 호출이 실패해 규칙 결과만 씀"}`);

// Q40 대화로 물어보기: 답의 숫자가 DB와 같고, 물어도 기록은 그대로다
const c40 = count();
const expense40 = { n: count(`kind='expense' AND ${`record_date BETWEEN '${month}-01' AND '${addDays(`${month}-01`, 40).slice(0, 7)}-01'`}`), s: sum(`kind='expense' AND record_date LIKE '${month}-%'`) };
const cafe40 = { n: count(`category_id='cafe' AND record_date LIKE '${month}-%'`), s: sum(`category_id='cafe' AND record_date LIKE '${month}-%'`) };
const q40 = [];
for (const text of ["이번 달 얼마 썼지", "이번 달 카페 얼마", "이번 달 수입", "오늘 뭐 썼지", "내일 뭐 썼지", "이번 달 삼성카드 얼마"]) {
  await send(text);
  q40.push(await last());
  await panel.locator("textarea").fill("");
}
await shot("qa-q40-query");
log(
  "Q40",
  q40[0].startsWith(`이번 달 지출: ${count(`kind='expense' AND record_date LIKE '${month}-%'`)}건, ${won(expense40.s)}원`) &&
    q40[1].startsWith(`이번 달 카페: ${cafe40.n}건, ${won(cafe40.s)}원`) &&
    q40[2].startsWith("이번 달 수입: 1건, 3,000,000원") &&
    q40[3].startsWith(`오늘 기록: ${count(`record_date='${today}'`)}건, 지출 합계 ${won(sum(`kind='expense' AND record_date='${today}'`))}원`) &&
    q40[4] === "아직 오지 않은 날은 답할 수 없어요" &&
    q40[5].startsWith("무엇을 묻는지 알아듣지 못했어요") &&
    count() === c40,
  `${q40.slice(0, 3).map((a) => `「${a.replace(" 자세히 보기", "")}」`).join(" · ")} · 「${q40[3].slice(0, 34)}…」 · 미래 「${q40[4]}」 · 모르는 낱말 「${q40[5].slice(0, 18)}…」 — DB 합계와 같음, 기록 ${c40}→${count()}건`,
);

// Q41 고정지출: 등록 → 보기 → 삭제. 문장만으로는 바뀌지 않고 버튼을 눌러야 한다
await send("넷플릭스 17000원 매달 15일 고정지출");
const before41 = d1("SELECT COUNT(*) AS n FROM recurring_items")[0].n;
await budget("write");
await panel.getByRole("button", { name: "등록하기" }).last().click();
await panel.getByText("등록했어요. 매달 15일에 물어볼게요").waitFor();
const item41 = d1("SELECT title, amount, day_of_month, kind FROM recurring_items")[0];
await send("고정지출 보여줘");
const list41 = await last();
await send("넷플릭스 고정지출 삭제");
const mid41 = d1("SELECT COUNT(*) AS n FROM recurring_items")[0].n;
await budget("write");
await panel.getByRole("button", { name: "삭제하기" }).last().click();
await panel.getByText("지웠어요. 이제 묻지 않을게요").waitFor();
const after41 = d1("SELECT COUNT(*) AS n FROM recurring_items")[0].n;
log("Q41", before41 === 0 && item41?.title === "넷플릭스" && item41.amount === 17000 && item41.day_of_month === 15 && list41.includes("넷플릭스") && mid41 === 1 && after41 === 0, `문장만 보낸 뒤 ${before41}개 → 「등록하기」 ${JSON.stringify(item41)} → 「고정지출 보여줘」 목록에 넷플릭스 → 삭제 문장만 보낸 뒤 ${mid41}개 → 「삭제하기」 ${after41}개`);

// Q42 카드 등록 → 다음 문장부터 카드 이름을 알아본다
await send("삼성카드 등록해줘");
await budget("write");
await panel.getByRole("button", { name: "등록하기" }).last().click();
await panel.getByText("이제 「삼성카드」라고 적으면 알아볼게요").waitFor();
const cards42 = d1("SELECT name, method FROM cards");
await send("점심 9천원 삼성카드");
const card42 = (await panel.locator("ul > li").last().innerText()).replace(/\s+/g, " ");
await panel.getByRole("button", { name: "카드 지우기" }).first().click();
await close();
log("Q42", cards42.length === 1 && cards42[0].name === "삼성카드" && card42.includes("삼성카드") && card42.includes("9,000원"), `등록 ${JSON.stringify(cards42)} → 「점심 9천원 삼성카드」 카드 「${card42.slice(0, 44)}」`);

// Q43 개인정보 · 비밀 값: 브라우저가 받은 응답과 서버 로그
const marker = "큐에이표식어";
await open();
await later();
await send(`${marker} 7700원`);
await panel.getByRole("button", { name: "카드 지우기" }).first().click();
await close();
const serverLog = SERVER_LOG && fs.existsSync(SERVER_LOG) ? fs.readFileSync(SERVER_LOG, "utf8") : null;
const inLog = serverLog === null ? null : serverLog.includes(marker) || serverLog.includes("7700") || serverLog.includes("우산");
log(
  "Q43",
  leaks.size === 0 && inLog !== true,
  `응답 ${urls.size}개(HTML · JS · RSC) 검색 → ${leaks.size ? JSON.stringify([...leaks]) : "OpenAI 주소 · 키 이름 · 모델 이름 · 프롬프트 조각 없음"} · 서버 로그 ${inLog === null ? "(로그 파일을 주지 않아 건너뜀)" : inLog ? "에 문장이 남음" : "에 보낸 문장 · 금액 없음"}`,
);

// Q44 문장 보내기 요청 제한: 1분 안에 21번째에서 안내. 다음 분이 시작된 직후에 시작한다
await new Promise((r) => setTimeout(r, 61000 - (Date.now() % 60000)));
await open();
await later();
let at = null;
for (let i = 1; i <= 21; i++) {
  await panel.locator("textarea").fill("고정지출 보여줘");
  await panel.getByRole("button", { name: "보내기" }).click();
  await panel.getByText("정리하고 있어요…").waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(150);
  if ((await last()).includes("요청이 너무 많아요")) {
    at = i;
    break;
  }
}
await shot("qa-q44-limit");
log("Q44", at === 21, `1분 안에 ${at}번째 문장에서 「요청이 너무 많아요. 잠시 후 다시 시도해 주세요」`);

console.log("page errors:", errs);
fs.writeFileSync(`${OUT}/qa-assistant-result.json`, JSON.stringify(R, null, 2));
await browser.close();
process.exit(Object.values(R).every((r) => r.ok) ? 0 : 1);
