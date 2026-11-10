import type { Clock } from "@/domain/record/Clock";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
