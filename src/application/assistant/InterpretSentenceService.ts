import { CheckedRecordParser, type CheckedParseResult, DraftValidator } from "@/domain/assistant/DraftValidator";
import { RuleRecordParser } from "@/domain/assistant/RuleRecordParser";
import type { Clock } from "@/domain/record/Clock";

// 문장 한 번을 기록 초안으로 정리한다 (80-record-assistant §2).
// 읽는 순서는 앱과 같다: ① 도움말 → ② 고정지출 → ③ 카드 등록 → ④ 기록 규칙 파서 → ⑤ 읽지 못한 조각만 OpenAI → ⑥ 검증기.
// 지금은 ④ · ⑥만 한다. ① ~ ③(추가 기능)과 ⑤(OpenAI)는 다음 단계에서 이 서비스에 끼운다.
// 입력 문장을 로그 · 오류에 싣지 않는다 — 실패는 ParseFailedError(이유 코드)로만 알린다
export class InterpretSentenceService {
  private readonly validator: DraftValidator;

  constructor(private readonly clock: Clock) {
    this.validator = new DraftValidator(clock);
  }

  async execute(text: string): Promise<CheckedParseResult> {
    // 등록 카드 이름 인식은 카드 등록(E)과 함께 붙인다 — 지금은 등록 카드 없이 읽는다
    return new CheckedRecordParser(new RuleRecordParser([]), this.validator, this.clock).parse(text);
  }
}
