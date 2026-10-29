import type { WaitlistEntry } from "./WaitlistEntry";

export type SaveResult = "created" | "duplicate";

export interface WaitlistRepository {
  /** 같은 이메일이 이미 있으면 저장하지 않고 duplicate */
  save(entry: WaitlistEntry): Promise<SaveResult>;
}
