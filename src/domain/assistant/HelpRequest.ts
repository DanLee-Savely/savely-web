// 무엇을 할 수 있는지 묻는 말인가 — 「도움말」 · 「사용법」 · 「뭐 할 수 있어」 (앱 isChatHelpRequest에서 옮김, 80 F)
const HELP_WORD = /도움말|사용법|사용\s?방법|할\s?수\s?있는\s?일|(?:뭐|뭘|무엇을?|무얼)\s?할\s?수\s?있/;

export class HelpRequest {
  /** 숫자가 든 문장은 기록일 수 있으므로 묻는 말로 보지 않는다(`사용법 책 15000원`) */
  static matches(text: string): boolean {
    return !/\d/.test(text) && HELP_WORD.test(text);
  }
}
