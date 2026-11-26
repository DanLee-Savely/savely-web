import { AmountReader } from "../assistant/AmountReader";
import { NOT_PAYMENT_WORDS } from "../assistant/recordKeywords";

// 카드를 등록하려는 말 (앱 card_command_parser.dart에서 옮김, 80-record-assistant E)
// 여기서는 **읽기만** 한다. 카드는 화면의 「등록하기」를 눌러야 등록된다.

export type CardRegisterCommand = {
  /** 카드 이름. 비어 있으면 이름을 찾지 못한 것이다(`카드 등록`) — 이름을 함께 적어 달라고 안내한다. 길이는 여기서 자르지 않는다 */
  name: string;
  /** 이름에 「체크」가 있으면 체크카드, 아니면 신용카드. 등록 전에 화면에서 바꿀 수 있다 */
  method: "credit_card" | "check_card";
};

// 등록하려는 말. 낱말 한가운데는 잡지 않는다(「추가요금」)
const REGISTER_WORD = /(?<![가-힣])(?:등록|추가)(?![가-힣]*요금)/;
// 문장에 붙는 부탁 · 꾸밈말 — 이름이 아니다
const FILLER = /(?<![가-힣])(?:등록|추가)(?:해\s?줘요?|해\s?주세요|할게요?|할래요?|해요?|하기)?(?![가-힣])|(?<![가-힣])(?:좀|새로|새|내|제)(?=\s|$)/g;
const SPACES = /\s+/;
const EDGE_MARKS = /^[\s\-–—~:·()[\]"'.,?!]+|[\s\-–—~:·()[\]"'.,?!]+$/g;
// `삼성카드를` → `삼성카드`. 「카드」 뒤에 붙은 조사만 뗀다
const TRAILING_JOSA = /(?<=카드)(?:으로|로|을|를|은|는|이|가|도)?$/;

const isCardWord = (token: string): boolean => token.endsWith("카드");

export class CardCommandParser {
  /**
   * [text]가 카드를 등록하려는 말이면 읽는다. 아니면 null — 평소처럼 기록으로 정리한다.
   * 조건: 「카드」로 끝나는 낱말이 있고, 「등록」 · 「추가」가 있고, 단위가 붙은 금액이 없다(`카드값 80만원 추가`는 기록이다).
   * 「교통카드」처럼 결제수단이 아닌 카드, 「카드값」 같은 낱말은 카드 이름으로 보지 않는다
   */
  static parse(text: string): CardRegisterCommand | null {
    if (!REGISTER_WORD.test(text)) return null;
    // 단위 없는 숫자는 이름일 수 있다(`국민 357카드`)
    if (AmountReader.read(text).some((s) => s.hasUnit)) return null;
    const tokens = text.replace(FILLER, " ").split(SPACES).map((t) => t.replace(EDGE_MARKS, "")).filter(Boolean).map((t) => t.replace(TRAILING_JOSA, ""));
    if (!tokens.some(isCardWord)) return null;
    // 결제수단이 아닌 카드만 있으면 카드 등록 이야기가 아니다
    if (tokens.filter(isCardWord).every((t) => NOT_PAYMENT_WORDS.includes(t))) return null;
    // 「카드 등록 삼성카드」의 앞 「카드」는 이름이 아니다. 「카드」만 적었으면 이름이 없는 것이다
    const named = tokens.filter((t) => t !== "카드");
    const name = named.some(isCardWord) ? named.join(" ") : "";
    return { name, method: name.includes("체크") ? "check_card" : "credit_card" };
  }
}
