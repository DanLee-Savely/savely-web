import type { AssistantUsage } from "@/domain/assistant/DraftOrganizer";

// 단위 테스트 전용
export class InMemoryAssistantUsage implements AssistantUsage {
  private readonly calls = new Map<string, number>();

  async tryUse(date: string, limit: number): Promise<boolean> {
    const used = this.calls.get(date) ?? 0;
    if (used >= limit) return false;
    this.calls.set(date, used + 1);
    return true;
  }

  count(date: string): number {
    return this.calls.get(date) ?? 0;
  }
}
