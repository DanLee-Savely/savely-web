import { DomainError } from "../DomainError";
import { CategoryCatalog } from "../record/CategoryCatalog";
import type { Clock } from "../record/Clock";
import { RecordDate } from "../record/RecordDate";
import { CARD_METHODS, KINDS, PAYMENT_METHODS } from "../record/RecordEntry";
import { RecordCardName, RecordTitle } from "../record/RecordText";
import type { ParsedDraft, ParseFailure, ParseResult } from "./ParsedDraft";
import { RecordDateReader } from "./RecordDateReader";

/** 기록 초안의 한도 (앱 RecordDraftLimits와 같다, 80-record-assistant §6-4 · §7) */
export const DRAFT_LIMITS = {
  minAmount: 1,
  maxAmount: 999_999_999_999,
  /** 앱 서버 title 한도(UTF-16 길이). 이모지는 한 글자가 두 칸이라 60자 안에서도 넘을 수 있다 — 앱과 같은 자리에서 자른다 */
  maxTitleCodeUnits: 100,
  /** 한 번에 만드는 항목 수 */
  maxDrafts: 20,
  /** 한 번에 받는 입력 글자 수 */
  maxInputLength: 500,
  /** 문장에 적은 날짜가 오늘에서 이만큼까지만 거슬러 올라간다 */
  maxDaysBack: 30,
} as const;

/** 검증을 통과한 초안과, 걸러낸 건수 */
export type ValidatedDrafts = {
  drafts: ParsedDraft[];
  /** 금액이 범위를 벗어나 버린 건수 */
  invalidCount: number;
  /** 날짜가 미래이거나 너무 오래돼 버린 건수 */
  invalidDateCount: number;
  /** 항목 수 한도를 넘어 버린 건수 */
  overflowCount: number;
};

/** 화면이 쓰는 해석 결과 — 검증을 마친 값만 들어 있다 */
export type CheckedParseResult = ValidatedDrafts & {
  /** 해석하지 못한 원문 조각. 입력 문장에 실제로 있던 글자만 남긴다 */
  unparsed: string[];
};

/** 문장을 정리하지 못했다. 이유 코드만 싣는다 — 입력 문장을 오류 · 로그에 넣지 않는다 */
export class ParseFailedError extends DomainError {
  readonly code = "PARSE_FAILED";

  constructor(readonly failure: ParseFailure) {
    super();
  }
}

const BLANK = /[\s\u0000-\u001f\u007f]+/g;
const collapse = (raw: string): string => raw.replace(BLANK, " ").trim();

// 공통 검증기 — 파서 출력과 화면 사이의 신뢰 경계 (앱 record_draft_validator.dart에서 옮김)
//
// 규칙이 만든 초안이든 OpenAI가 만든 초안이든 여기를 통과한 것만 카드가 된다. 파서를 믿지 않는다.
// - 금액이 범위 밖 → 초안을 버린다
// - 없는 카테고리 · 구분과 안 맞는 카테고리 → 카테고리만 비운다(사용자가 고른다)
// - 내용이 한도 초과 → 한도까지 자른다(사용자가 카드에서 보고 고친다)
// - 지출이 아닌데 결제수단 · 카드 이름 → 비운다. 카드 이름은 카드 결제일 때만, 20자를 넘으면 비운다(자르지 않는다)
// - 날짜가 미래이거나 30일보다 오래됨 → 초안을 버린다(엉뚱한 날에 조용히 저장되는 것보다 뺐다고 알리는 편이 낫다)
export class DraftValidator {
  constructor(private readonly clock: Clock) {}

  /** 문장에 적은 날짜로 받을 수 있는가. null(화면 날짜)은 늘 받는다 */
  acceptsDate(date: string | null): boolean {
    if (date === null) return true;
    const today = RecordDate.today(this.clock);
    return date <= today && date >= RecordDateReader.addDays(today, -DRAFT_LIMITS.maxDaysBack);
  }

  /** 입력 문장이 글자 수 한도 안인지. 글자 수는 코드 포인트로 센다 */
  acceptsInput(text: string): boolean {
    return [...text].length <= DRAFT_LIMITS.maxInputLength;
  }

  validate(drafts: readonly ParsedDraft[]): ValidatedDrafts {
    const out: ValidatedDrafts = { drafts: [], invalidCount: 0, invalidDateCount: 0, overflowCount: 0 };
    for (const draft of drafts) {
      if (out.drafts.length >= DRAFT_LIMITS.maxDrafts) out.overflowCount++;
      else if (!this.acceptsDate(draft.date)) out.invalidDateCount++;
      else {
        const checked = this.validateOne(draft);
        if (checked) out.drafts.push(checked);
        else out.invalidCount++;
      }
    }
    return out;
  }

  /** 초안 한 건을 한도에 맞춘다. 살릴 수 없으면 null */
  validateOne(draft: ParsedDraft): ParsedDraft | null {
    const amountOk = Number.isInteger(draft.amount) && draft.amount >= DRAFT_LIMITS.minAmount && draft.amount <= DRAFT_LIMITS.maxAmount;
    if (!amountOk || !(KINDS as readonly string[]).includes(draft.kind) || !this.acceptsDate(draft.date)) return null;
    const method = draft.kind === "expense" && draft.paymentMethod !== null && (PAYMENT_METHODS as readonly string[]).includes(draft.paymentMethod) ? draft.paymentMethod : null;
    return {
      kind: draft.kind,
      amount: draft.amount,
      categoryId: DraftValidator.category(draft.categoryId, draft.kind),
      title: DraftValidator.cleanTitle(draft.title),
      paymentMethod: method,
      cardName: method !== null && CARD_METHODS.includes(method) ? DraftValidator.cleanCardName(draft.cardName) : null,
      date: draft.date,
    };
  }

  private static category(id: string | null, kind: string): string | null {
    return id !== null && CategoryCatalog.kindOf(id) === kind ? id : null;
  }

  /** 줄바꿈 · 제어문자를 빈칸 하나로 줄이고 한도까지 자른다 */
  private static cleanTitle(raw: string | null): string | null {
    if (raw === null) return null;
    let out = "";
    let count = 0;
    for (const char of collapse(raw)) {
      if (count >= RecordTitle.MAX || out.length + char.length > DRAFT_LIMITS.maxTitleCodeUnits) break;
      out += char;
      count++;
    }
    return out.trim() || null;
  }

  /** 카드 이름은 자르지 않는다 — 잘린 이름은 등록한 카드와 맞지 않는 다른 이름이 된다 */
  static cleanCardName(raw: string | null): string | null {
    if (raw === null) return null;
    const flat = collapse(raw);
    return flat && [...flat].length <= RecordCardName.MAX ? flat : null;
  }
}

/** 문장을 초안으로 바꾸는 파서(규칙 기반). 값의 범위는 보장하지 않아도 된다 — 검증은 DraftValidator가 한다 */
export interface RecordParser {
  parse(text: string, today: string): ParseResult;
}

// 파서를 검증기로 감싼 단일 입구. 화면 · 서비스는 파서를 직접 부르지 않고 이것만 부른다
// 1. 입력이 글자 수 한도를 넘으면 파서를 부르지 않고 거절한다
// 2. 파서가 무엇을 던지든 ParseFailedError(이유 코드)로 바꾼다. 원래 오류는 버린다 — 메시지에 원문이 실릴 수 있다
// 3. 초안을 DraftValidator에 통과시킨다
// 4. 「해석 못 한 조각」은 입력 문장에 실제로 있는 것만 남긴다 — 파서가 지어낸 글이 안내 문구 자리에 나오는 것을 막는다
export class CheckedRecordParser {
  constructor(
    private readonly parser: RecordParser,
    private readonly validator: DraftValidator,
    private readonly clock: Clock,
  ) {}

  parse(text: string): CheckedParseResult {
    if (!this.validator.acceptsInput(text)) throw new ParseFailedError("inputTooLong");
    if (!text.trim()) return { drafts: [], unparsed: [], invalidCount: 0, invalidDateCount: 0, overflowCount: 0 };
    let raw: ParseResult;
    try {
      raw = this.parser.parse(text, RecordDate.today(this.clock));
    } catch {
      throw new ParseFailedError("failed");
    }
    const unparsed = raw.unparsed.map((p) => p.trim()).filter((p) => p && text.includes(p)).slice(0, DRAFT_LIMITS.maxDrafts);
    return { ...this.validator.validate(raw.drafts), unparsed };
  }
}
