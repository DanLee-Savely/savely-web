// 문장 세트 사본이 모바일 앱의 원본과 같은지 확인한다 (80-record-assistant §11).
// 문장(text) · 기대값(expect) · 등록 카드(cards) · 못 읽은 조각(unparsed) · assume만 견준다. 설명글(about · note · review)은 웹 사본에 없다.
// 실행: node scripts/check-assistant-fixtures.mjs [앱 저장소 경로]  — 기본은 ../app. 앱 저장소가 없으면(공개 저장소만 받은 경우) 건너뛴다
import fs from "node:fs";
import path from "node:path";

const app = path.resolve(process.argv[2] ?? "../app", "test/fixtures");
const web = path.resolve("src/domain/assistant/fixtures");
const PAIRS = {
  "record-sentences.json": "record_chat_sentences.json",
  "date-sentences.json": "record_chat_sentences_dates.json",
  "recurring-sentences.json": "recurring_sentences.json",
  "card-sentences.json": "card_sentences.json",
};
const KEYS = ["id", "text", "expect", "cards", "unparsed", "assume"];
const pick = (c) => JSON.stringify(Object.fromEntries(KEYS.filter((k) => k in c).map((k) => [k, c[k]])));
const cases = (file) => JSON.parse(fs.readFileSync(file, "utf8")).cases;

if (!fs.existsSync(app)) {
  console.log(`앱 문장 세트가 없어 건너뜁니다: ${app}`);
  process.exit(0);
}
let failed = 0;
for (const [webName, appName] of Object.entries(PAIRS)) {
  const mine = cases(path.join(web, webName)).map(pick);
  const theirs = cases(path.join(app, appName)).map(pick);
  const diff = theirs.filter((c, i) => c !== mine[i]).length + Math.abs(theirs.length - mine.length);
  console.log(`${diff ? "다름" : "같음"}  ${webName} ↔ ${appName}  (${mine.length}건 / ${theirs.length}건${diff ? `, 다른 곳 ${diff}` : ""})`);
  failed += diff;
}
process.exit(failed ? 1 : 0);
