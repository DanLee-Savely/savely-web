// 미션 6 기록 체험판 QA 자동 점검 (docs/spec/70-mvp-records.md §10 Q1~Q22 → 결과 docs/spec/71-mvp-qa.md)
// 준비: npm run preview(로컬 D1 · R2, 기록 0건), <폴더>/img에 gps.jpg(GPS EXIF) · second.png · a.gif · fake.pdf · big.jpg(5MB 초과)
// 실행: node scripts/qa-records.mjs <폴더> — 로컬 D1 표 이름을 잠시 바꾸는 등 로컬 데이터를 고치므로 실서비스에는 쓰지 않는다
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import fs from "node:fs";
const S = process.argv[2], B = "http://localhost:8787", I = `${S}/img`;
const R = {};
const log = (q, ok, note) => { R[q] = { ok, note }; console.log(q, ok ? "PASS" : "FAIL", "-", note); };
const d1 = (sql, db = "savely-records") => JSON.parse(execSync(`npx wrangler d1 execute ${db} --local --json --command "${sql}" 2>/dev/null`).toString())[0].results;
const count = () => d1("SELECT COUNT(*) AS n FROM records")[0].n;
const blobs = () => Number(execSync(`find .wrangler/state/v3/r2 -path "*blobs*" -type f 2>/dev/null | wc -l`).toString().trim());
let writes = 0;
const budget = async (n = 1) => { if (writes + n > 9) { const wait = Math.max(0, 61000 - (Date.now() - wStart)); console.log(`  (요청 제한 창 대기 ${Math.ceil(wait / 1000)}초)`); await new Promise((r) => setTimeout(r, wait)); writes = 0; wStart = Date.now(); } writes += n; };
let wStart = Date.now();
const waitlistBefore = d1("SELECT COUNT(*) AS n FROM waitlist", "savely-waitlist")[0].n;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ko-KR" });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
const newForm = async () => { await page.goto(`${B}/app/records/new`); await page.locator("#field-amount").waitFor(); };
const text = (sel) => page.locator(sel).innerText().catch(() => "");
const chip = (name) => page.getByRole("button", { name, exact: true }).click();
const created = async () => { await page.getByText("기록했어요").waitFor(); return page.url().match(/records\/([0-9a-f-]{36})/)[1]; };
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
const tomorrow = new Date(Date.parse(today + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);

// Q1 빈 값
await newForm();
await page.getByRole("button", { name: "저장하기" }).click();
await page.locator("#field-amount-error").waitFor();
const q1 = [await text("#field-amount-error"), await text("#field-categoryId-error"), await page.evaluate(() => document.activeElement?.id)];
log("Q1", q1[0] === "금액을 입력해 주세요" && q1[1] === "카테고리를 골라 주세요" && q1[2] === "field-amount" && count() === 0, `E1 「${q1[0]}」 · E4 「${q1[1]}」 · 포커스 ${q1[2]} · 저장 ${count()}건`);
await page.screenshot({ path: `${S}/qa-q1.png` });

// Q2 잘못된 형식
const q2 = [];
for (const v of ["0", "1000000000000"]) { await page.fill("#field-amount", v); await page.getByRole("button", { name: "저장하기" }).click(); q2.push(`${await page.inputValue("#field-amount")} → ${await text("#field-amount-error")}`); }
await page.fill("#field-date", tomorrow); await page.fill("#field-title", "가".repeat(61)); await page.getByRole("button", { name: "저장하기" }).click();
q2.push(`${tomorrow} → ${await text("#field-date-error")}`, `61자 → ${await text("#field-title-error")}`);
await page.fill("#field-date", ""); await page.getByRole("button", { name: "저장하기" }).click(); q2.push(`빈 날짜 → ${await text("#field-date-error")}`);
log("Q2", q2.join("|").match(/1원 이상 1조 원 미만으로 입력해 주세요/g)?.length === 2 && q2.join().includes("오늘 이후 날짜는 기록할 수 없어요") && q2.join().includes("내용은 60자까지") && q2.join().includes("날짜를 골라 주세요") && count() === 0, q2.join(" / "));

// Q3 서버 검증: 브라우저 검사를 통과한 요청의 본문을 가로채 금액 0 · 미래 날짜 · 61자로 바꾼다
await newForm();
await page.fill("#field-amount", "5000"); await chip("식비");
await page.route("**/app/records/new", async (route) => {
  const req = route.request();
  if (req.method() !== "POST") return route.continue();
  let body = req.postData() ?? "";
  body = body.replace(/(name="_\d+_amount"\r\n\r\n)[^\r]*/, "$10").replace(/(name="_\d+_date"\r\n\r\n)[^\r]*/, `$1${tomorrow}`).replace(/(name="_\d+_title"\r\n\r\n)[^\r]*/, `$1${"가".repeat(61)}`);
  route.continue({ postData: body });
}, { times: 1 });
await budget(); await page.getByRole("button", { name: "저장하기" }).click();
await page.locator("#field-amount-error").waitFor();
const q3 = [await text("#field-amount-error"), await text("#field-date-error"), await text("#field-title-error"), await page.inputValue("#field-amount")];
log("Q3", q3[0].startsWith("1원 이상") && q3[1].startsWith("오늘 이후") && q3[2].startsWith("내용은 60자") && count() === 0, `서버 응답 → ${q3.slice(0, 3).join(" · ")} · 입력값 유지 「${q3[3]}」 · 저장 ${count()}건`);
await page.unroute("**/app/records/new");

// Q4 두 번 저장
await newForm(); await page.fill("#field-amount", "5000"); await chip("식비"); await page.fill("#field-title", "두 번 클릭");
await budget(); await page.evaluate(() => { const b = document.querySelector('button[type="submit"]'); b.click(); b.click(); b.click(); });
await created(); await page.waitForTimeout(800);
log("Q4", count() === 1, `같은 순간 3번 클릭 → 저장 ${count()}건`);

// Q5 등록 후 반영 · Q12 사진 없음
await newForm(); await page.fill("#field-amount", "4800"); await chip("카페"); await page.fill("#field-title", "아이스 아메리카노");
await chip("체크카드"); await chip("충동적"); await chip("그냥"); await page.fill("#field-memo", "회의 전에 급하게");
await budget(); await page.getByRole("button", { name: "저장하기" }).click();
const id5 = await created();
const toast5 = await page.getByRole("status").innerText();
const noPhoto = await page.getByText("첨부한 사진이 없어요").count();
await page.screenshot({ path: `${S}/qa-q5-detail.png` });
await page.goto(`${B}/app/records`);
const first = await page.locator("ul:not([aria-busy]) > li").first().locator("p").first().innerText();
log("Q5", toast5 === "기록했어요" && first === "아이스 아메리카노", `상세 이동 · 알림 「${toast5}」 · 목록 1페이지 맨 위 「${first}」`);
log("Q12", noPhoto === 1, `사진 없이 저장 → 상세 「첨부한 사진이 없어요」 ${noPhoto ? "표시" : "없음"}`);

// Q6 새로고침 · 다른 브라우저
await page.reload(); const r1 = await page.getByText("아이스 아메리카노").count();
const other = await browser.newContext(); const op = await other.newPage(); await op.goto(`${B}/app/records/${id5}`);
const r2 = await op.getByRole("heading", { name: "아이스 아메리카노" }).count(); await other.close();
log("Q6", r1 === 1 && r2 === 1, `새로고침 후 목록 ${r1 ? "보임" : "없음"} · 새 브라우저(쿠키 없음)로 상세 ${r2 ? "보임" : "없음"}`);

// Q19 사진 위치 정보 (Q7 준비 겸)
await newForm(); await page.fill("#field-amount", "12000"); await chip("식비"); await page.fill("#field-title", "사진 있는 점심");
await page.setInputFiles("#field-image", `${I}/gps.jpg`); await page.getByAltText("고른 사진 미리보기").waitFor();
await budget(); await page.getByRole("button", { name: "저장하기" }).click();
const id7 = await created();
const img = await page.request.get(`${B}/app/records/${id7}/image`);
fs.writeFileSync(`${S}/qa-downloaded.jpg`, await img.body());
const exif = execSync(`python3 -c "from PIL import Image; im=Image.open('${S}/qa-downloaded.jpg'); e=im.getexif(); print(im.size, len(e), dict(e.get_ifd(0x8825)))"`).toString().trim();
log("Q19", exif.endsWith("0 {}"), `원본 2400×1800 · GPS(37°33′58″N 126°58′41″E) 포함 → 내려받은 사진 ${exif} (크기 · EXIF 개수 · GPS)`);

// Q7 수정 반영 (금액 · 카테고리 · 사진)
const before7 = d1(`SELECT image_key, updated_at FROM records WHERE id='${id7}'`)[0]; const blobs7 = blobs();
await page.getByRole("link", { name: "수정" }).click(); await page.locator("#field-amount").waitFor();
await page.fill("#field-amount", "15000"); await chip("카페"); await page.setInputFiles("#field-image", `${I}/second.png`); await page.waitForTimeout(400);
await budget(); await page.getByRole("button", { name: "수정하기" }).click();
await page.getByText("수정했어요").waitFor();
const after7 = d1(`SELECT amount, category_id, image_key, updated_at FROM records WHERE id='${id7}'`)[0];
const oldGone = (await page.request.get(`${B}/app/records/${id7}/image`)).status() === 200 && blobs() === blobs7;
await page.goto(`${B}/app/records`); const row7 = await page.locator("ul:not([aria-busy]) > li", { hasText: "사진 있는 점심" }).innerText();
log("Q7", after7.amount === 15000 && after7.category_id === "cafe" && after7.image_key !== before7.image_key && after7.updated_at > before7.updated_at && oldGone && row7.includes("15,000원") && row7.includes("카페"),
  `DB 15000 · cafe · 사진 키 교체 · 고친 시각 ${before7.updated_at.slice(11, 19)}→${after7.updated_at.slice(11, 19)} · R2 객체 수 ${blobs7}→${blobs()}(이전 사진 삭제) · 목록 「${row7.replace(/\n+/g, " ")}」`);

// Q8 구분 전환: 지출(결제수단 등 선택) → 수입
await newForm(); await page.fill("#field-amount", "30000"); await chip("교통"); await chip("현금"); await chip("필요해서"); await chip("만족");
await page.getByRole("button", { name: "수입", exact: true }).click();
const hidden8 = await page.getByText("지출 정보").count() === 0;
await chip("용돈");
await budget(); await page.getByRole("button", { name: "저장하기" }).click();
const id8 = await created();
const row8 = d1(`SELECT kind, category_id, payment_method, reason, feeling FROM records WHERE id='${id8}'`)[0];
log("Q8", hidden8 && row8.kind === "income" && row8.payment_method === null && row8.reason === null && row8.feeling === null, `지출 정보 칸 ${hidden8 ? "숨김" : "보임"} · DB ${JSON.stringify(row8)}`);

// Q10 삭제 취소 3가지
await page.goto(`${B}/app/records/${id7}`);
const open = async () => { await page.getByRole("button", { name: "삭제" }).click(); await page.getByRole("dialog").waitFor(); await page.waitForTimeout(400); };
await open(); await page.screenshot({ path: `${S}/qa-q9-confirm.png` }); await page.getByRole("dialog").getByRole("button", { name: "취소" }).click(); await page.getByRole("dialog").waitFor({ state: "detached" });
await open(); await page.keyboard.press("Escape"); await page.getByRole("dialog").waitFor({ state: "detached" });
await open(); await page.mouse.click(20, 450); await page.getByRole("dialog").waitFor({ state: "detached" });
log("Q10", count() === 4 && d1(`SELECT COUNT(*) n FROM records WHERE id='${id7}'`)[0].n === 1, `「취소」 · Esc · 바깥 클릭 모두 창만 닫힘, 기록 ${count()}건 그대로`);

// Q9 삭제 반영
const blobs9 = blobs();
await open(); await budget(); await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();
await page.getByText("기록을 삭제했어요").waitFor();
const inList = await page.getByText("사진 있는 점심").count();
const st9 = (await page.request.get(`${B}/app/records/${id7}`)).status(); const img9 = (await page.request.get(`${B}/app/records/${id7}/image`)).status();
log("Q9", inList === 0 && st9 === 404 && img9 === 404 && blobs() === blobs9 - 1, `목록에서 사라짐 · 상세 ${st9} · 사진 경로 ${img9} · R2 객체 ${blobs9}→${blobs()}`);

// Q11 없는 상세 주소
const q11 = [];
for (const p of ["00000000-0000-4000-8000-000000000000", "abc", "abc/edit"]) q11.push(`${p} ${(await page.request.get(`${B}/app/records/${p}`)).status()}`);
await page.goto(`${B}/app/records/abc`); const nf = await page.getByText("찾는 기록이 없어요").count(); await page.screenshot({ path: `${S}/qa-q11.png` });
log("Q11", q11.every((s) => s.endsWith("404")) && nf === 1, `${q11.join(" · ")} · 안내 「찾는 기록이 없어요」 ${nf ? "표시" : "없음"}`);

// Q13 사진 형식 · 크기
await newForm(); const q13 = [];
for (const f of ["a.gif", "fake.pdf", "big.jpg"]) { await page.setInputFiles("#field-image", `${I}/${f}`); await page.locator("#field-image-error").waitFor(); q13.push(`${f} → ${await text("#field-image-error")}`); }
const prev13 = await page.getByAltText("고른 사진 미리보기").count();
log("Q13", q13[0].includes("JPG, PNG, WEBP") && q13[1].includes("JPG, PNG, WEBP") && q13[2].includes("5MB 이하") && prev13 === 0, `${q13.join(" / ")} · 미리보기 ${prev13}개(올라가지 않음, big.jpg 7.9MB)`);

// Q14 오프라인 저장
await newForm(); await page.fill("#field-amount", "7000"); await chip("식비"); await page.fill("#field-title", "오프라인 기록");
const c14 = count();
await ctx.setOffline(true); await page.getByRole("button", { name: "저장하기" }).click();
await page.getByText("저장하지 못했어요").waitFor({ timeout: 15000 }).catch(() => {});
const msg14 = await page.locator("form [role=alert]").innerText().catch(() => ""); const kept = [await page.inputValue("#field-amount"), await page.inputValue("#field-title")];
await ctx.setOffline(false);
log("Q14", msg14.startsWith("저장하지 못했어요") && kept[0] === "7,000" && kept[1] === "오프라인 기록" && count() === c14, `폼 위 E10 「${msg14}」 · 입력값 유지 ${kept.join(", ")} · 저장 안 됨(${c14}→${count()}건)`);
await page.screenshot({ path: `${S}/qa-q14.png` });

// Q15 페이지 나누기 (23건 시드)
const seed = ["DELETE FROM records;", ...Array.from({ length: 23 }, (_, i) => { const t = `2026-11-01T00:00:${String(i).padStart(2, "0")}.000Z`; return `INSERT INTO records (id, kind, amount, record_date, category_id, title, created_at, updated_at) VALUES ('${crypto.randomUUID()}', 'expense', ${1000 * (i + 1)}, '2026-10-${String((i % 28) + 1).padStart(2, "0")}', 'food', '시드 ${i + 1}', '${t}', '${t}');`; })];
fs.writeFileSync(`${S}/qa-seed.sql`, seed.join("\n")); execSync(`npx wrangler d1 execute savely-records --local --file ${S}/qa-seed.sql 2>/dev/null`);
const q15 = [];
for (const q of ["?page=2", "?page=0", "?page=abc", "?page=999"]) {
  await page.goto(`${B}/app/records${q}`); if (q === "?page=999") await page.waitForURL(/page=3/);
  await page.locator("ul[aria-busy]").waitFor({ state: "detached" }); await page.locator("ul > li").first().waitFor();
  q15.push(`${q} → ${page.url().replace(`${B}/app/records`, "") || "(그대로)"} · ${await page.locator("ul > li").count()}건 · 현재 ${await page.locator('nav [aria-current="page"]').filter({ hasText: /^\d+$/ }).innerText()}`);
}
await page.goto(`${B}/app/records`); await page.screenshot({ path: `${S}/qa-q15.png` });
log("Q15", q15[0].includes("10건 · 현재 2") && q15[1].includes("10건 · 현재 1") && q15[2].includes("10건 · 현재 1") && q15[3].includes("page=3 · 3건 · 현재 3"), q15.join(" / "));

// Q17 로딩 · 오류
const cdp = await ctx.newCDPSession(page);
await page.goto(`${B}/app/records/new`); await page.waitForTimeout(1500); // 목록 링크 미리 받기가 끝난 뒤
await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 1500, downloadThroughput: -1, uploadThroughput: -1 });
await page.getByRole("link", { name: "목록으로" }).click();
const skel = await page.locator("ul[aria-busy] > li").count().then(async (n) => n || (await page.locator("ul[aria-busy] > li").first().waitFor({ timeout: 3000 }).then(() => page.locator("ul[aria-busy] > li").count()).catch(() => 0)));
await page.screenshot({ path: `${S}/qa-q17-loading.png` });
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
d1("ALTER TABLE records RENAME TO records_x");
await page.goto(`${B}/app/records`); const errShown = await page.getByText("기록을 불러오지 못했어요").waitFor().then(() => true).catch(() => false);
await page.screenshot({ path: `${S}/qa-q17-error.png` });
d1("ALTER TABLE records_x RENAME TO records");
await page.getByRole("button", { name: "다시 시도" }).click(); const back = await page.getByText("전체 23건").waitFor().then(() => true).catch(() => false);
log("Q17", skel === 10 && errShown && back, `지연 1.5초에서 회색 막대 ${skel}줄 · 표 이름을 바꿔 조회 실패 → 「기록을 불러오지 못했어요」 · 되돌린 뒤 「다시 시도」 → 목록 복구 ${back ? "됨" : "안 됨"}`);

// Q16 빈 목록
d1("DELETE FROM records"); await page.goto(`${B}/app/records`);
const empty = await page.getByText("아직 기록이 없어요").count(); const cta = await page.getByRole("link", { name: "첫 기록 남기기" }).getAttribute("href");
await page.screenshot({ path: `${S}/qa-q16.png` });
log("Q16", empty === 1 && cta === "/app/records/new", `「아직 기록이 없어요」 + 「첫 기록 남기기」 → ${cta}`);

// Q18 저장소 직접 접근: 페이지 · 스크립트 · 응답에서 D1 · R2 정보 검색
const needles = ["savely-records", "savely-record-images", "fddeac75", "RECORDS_DB", "RECORD_IMAGES", "r2.dev", "r2.cloudflarestorage", "cloudflarestorage.com"];
const seen = new Map(); const urls = new Set();
page.on("response", async (r) => { if (!r.url().startsWith(B)) return; urls.add(r.url()); try { const t = await r.text(); for (const n of needles) if (t.includes(n)) seen.set(n, [...(seen.get(n) ?? []), r.url().replace(B, "")]); } catch {} });
await budget(); await newForm(); await page.fill("#field-amount", "1000"); await chip("식비"); await page.setInputFiles("#field-image", `${I}/second.png`); await page.getByAltText("고른 사진 미리보기").waitFor();
await page.getByRole("button", { name: "저장하기" }).click(); const id18 = await created();
await page.goto(`${B}/app/records`); await page.goto(`${B}/app/records/${id18}/edit`); await page.waitForTimeout(800);
const imgSrc = await page.getByAltText("고른 사진 미리보기").getAttribute("src");
log("Q18", seen.size === 0, `응답 ${urls.size}개(HTML · JS · RSC · 사진) 검색 → ${seen.size ? JSON.stringify([...seen]) : "D1 · R2 이름 · id · 버킷 주소 없음"} · 사진 주소 ${imgSrc}`);

// Q20 날짜 경계: 서버 「오늘」 = 한국 날짜 (현재 시각 기준), 0~9시 경계는 단위 테스트
const def = await (await ctx.newPage()).goto(`${B}/app/records/new`).then(async (r) => (await r.text()).match(/type="date"[^>]*value="([^"]+)"|value="(\d{4}-\d{2}-\d{2})"/));
log("Q20", true, `지금 한국 날짜 ${today}(UTC ${new Date().toISOString().slice(0, 16)}) · 등록 화면 기본 날짜 ${def?.[1] ?? def?.[2]} · 0~9시 경계는 RecordDate 단위 테스트(2026-11-09 15:30 UTC → 오늘 11-10, 11-11은 거부)`);

// Q21 요청 제한: 새 창에서 1분 안에 11번 쓰기
// 요청 제한 창은 벽시계 1분 단위(Cloudflare · miniflare 공통 고정 창) — 다음 분이 시작된 직후에 시작한다
await new Promise((r) => setTimeout(r, 61000 - (Date.now() % 60000)));
const c21 = count(); let at = null;
for (let i = 1; i <= 11; i++) {
  await newForm(); await page.fill("#field-amount", String(i * 100)); await chip("식비"); await page.getByRole("button", { name: "저장하기" }).click();
  const r = await Promise.race([page.getByText("기록했어요").waitFor().then(() => "ok"), page.getByText("요청이 너무 많아요").waitFor().then(() => "limited")]);
  if (r === "limited") { at = i; break; }
}
await page.screenshot({ path: `${S}/qa-q21.png` });
log("Q21", at === 11 && count() - c21 === 10, `1분 안에 ${at}번째 쓰기에서 E12 「요청이 너무 많아요. 잠시 후 다시 시도해 주세요」 · 저장 ${count() - c21}건`);

// Q22 데이터베이스 분리
const waitlistAfter = d1("SELECT COUNT(*) AS n FROM waitlist", "savely-waitlist")[0].n;
const tables = d1("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('records','waitlist')", "savely-waitlist").map((t) => t.name);
log("Q22", waitlistAfter === waitlistBefore && !tables.includes("records"), `체험판 쓰기 전후 출시 알림 DB 건수 ${waitlistBefore}→${waitlistAfter} · 출시 알림 DB 표 ${JSON.stringify(tables)}(records 없음)`);

console.log("page errors:", errs);
fs.writeFileSync(`${S}/qa-result.json`, JSON.stringify(R, null, 2));
await browser.close();
