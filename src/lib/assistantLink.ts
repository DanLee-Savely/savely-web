// 「대화로 기록하기」 패널을 연 채로 들어오는 주소(80-record-assistant E5).
// `/app?chat=1` → 홈 + 패널 열림. 소개 사이트의 「웹에서 체험하기」와 S05b 버튼이 이 주소로 온다.
// 패널을 연 뒤에는 주소에서 chat을 지운다 — 새로고침 · 뒤로 가기로 다시 열리지 않게
export const ASSISTANT_CHAT_PARAM = "chat";
export const ASSISTANT_CHAT_HREF = `/app?${ASSISTANT_CHAT_PARAM}=1`;
