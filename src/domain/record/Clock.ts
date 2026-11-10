// 현재 시각. 테스트에서 고정할 수 있게 인터페이스로 받는다
export interface Clock {
  now(): Date;
}
