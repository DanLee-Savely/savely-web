import { describe, expect, it } from "vitest";
import { ImageUploadError, InvalidRecordError, RecordNotFoundError } from "@/domain/record/errors";
import type { RecordDraft } from "@/domain/record/RecordEntry";
import { InMemoryImageStorage } from "@/infrastructure/record/InMemoryImageStorage";
import { InMemoryRecordRepository } from "@/infrastructure/record/InMemoryRecordRepository";
import { CreateRecordService } from "./CreateRecordService";
import { DeleteRecordService } from "./DeleteRecordService";
import { GetRecordService } from "./GetRecordService";
import { ListRecordsService } from "./ListRecordsService";
import { UpdateRecordService } from "./UpdateRecordService";

// 부를 때마다 1초씩 흐르는 시계(만든 순서 확인용)
let tick = 0;
const clock = { now: () => new Date(Date.UTC(2026, 10, 10, 3, 0, tick++)) };
const draft = (over: Partial<RecordDraft> = {}): RecordDraft => ({
  kind: "expense", amount: "9000", date: "2026-11-10", categoryId: "food", title: "", paymentMethod: "", reason: "", feeling: "", memo: "", ...over,
});
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
let n = 0;
const newId = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

const setup = (images = new InMemoryImageStorage(), repository = new InMemoryRecordRepository()) => ({
  repository,
  images,
  create: new CreateRecordService(repository, images, clock, newId),
  update: new UpdateRecordService(repository, images, clock),
  remove: new DeleteRecordService(repository, images),
  get: new GetRecordService(repository),
  list: new ListRecordsService(repository),
});

describe("기록 서비스", () => {
  it("등록 → 상세: 사진 키는 {기록 id}/…", async () => {
    const s = setup();
    const created = await s.create.execute({ draft: draft(), image: JPG });
    expect(created.imageKey?.startsWith(`${created.id}/`)).toBe(true);
    expect(await s.get.execute(created.id)).toEqual(created);
  });

  it("검증에 실패하면 사진도 기록도 저장하지 않는다", async () => {
    const s = setup();
    await expect(s.create.execute({ draft: draft({ amount: "" }), image: JPG })).rejects.toThrow(InvalidRecordError);
    expect([s.repository.size, s.images.keys.length]).toEqual([0, 0]);
  });

  it("사진 업로드가 실패하면 기록을 저장하지 않는다", async () => {
    const failing = new (class extends InMemoryImageStorage {
      async put(): Promise<string> {
        throw new ImageUploadError();
      }
    })();
    const s = setup(failing);
    await expect(s.create.execute({ draft: draft(), image: JPG })).rejects.toThrow(ImageUploadError);
    expect(s.repository.size).toBe(0);
  });

  it("기록 저장이 실패하면 올린 사진을 지운다", async () => {
    const broken = new (class extends InMemoryRecordRepository {
      async insert(): Promise<void> {
        throw new Error("D1");
      }
    })();
    const s = setup(undefined, broken);
    await expect(s.create.execute({ draft: draft(), image: JPG })).rejects.toThrow("D1");
    expect(s.images.keys).toEqual([]);
  });

  it("수정: 사진을 바꾸면 이전 사진을 지우고, 지우기만 해도 정리한다", async () => {
    const s = setup();
    const { id, imageKey } = await s.create.execute({ draft: draft(), image: JPG });
    const changed = await s.update.execute({ id, draft: draft({ amount: "500" }), image: JPG, removeImage: false });
    expect(changed.amount).toBe(500);
    expect(s.images.keys).toEqual([changed.imageKey]);
    expect(changed.imageKey).not.toBe(imageKey);
    const kept = await s.update.execute({ id, draft: draft(), image: null, removeImage: false });
    expect(kept.imageKey).toBe(changed.imageKey);
    const removed = await s.update.execute({ id, draft: draft(), image: null, removeImage: true });
    expect([removed.imageKey, s.images.keys]).toEqual([null, []]);
  });

  it("수정 중 다른 사람이 지웠다면 없는 기록, 새로 올린 사진도 지운다", async () => {
    const s = setup();
    const { id } = await s.create.execute({ draft: draft(), image: null });
    const vanished = new (class extends InMemoryRecordRepository {
      async update(): Promise<boolean> {
        return false;
      }
    })();
    await vanished.insert((await s.repository.findById(id))!);
    const u = new UpdateRecordService(vanished, s.images, clock);
    await expect(u.execute({ id, draft: draft(), image: JPG, removeImage: false })).rejects.toThrow(RecordNotFoundError);
    expect(s.images.keys).toEqual([]);
  });

  it("삭제: 사진도 지우고, 두 번째는 없는 기록", async () => {
    const s = setup();
    const { id } = await s.create.execute({ draft: draft(), image: JPG });
    await s.remove.execute(id);
    expect([s.repository.size, s.images.keys.length]).toEqual([0, 0]);
    await expect(s.remove.execute(id)).rejects.toThrow(RecordNotFoundError);
    await expect(s.get.execute(id)).rejects.toThrow(RecordNotFoundError);
  });

  it("형식이 틀린 id는 저장소를 보지 않고 없는 기록", async () => {
    const s = setup();
    await expect(s.get.execute("abc")).rejects.toThrow(RecordNotFoundError);
    await expect(s.remove.execute("abc")).rejects.toThrow(RecordNotFoundError);
  });

  it("목록: 날짜 최신순 · 같은 날은 만든 순서 역순, 10건씩, 잘못된 page는 1, 넘치면 마지막으로", async () => {
    const s = setup();
    for (let day = 1; day <= 12; day++) await s.create.execute({ draft: draft({ date: `2026-11-${String(day % 3 + 1).padStart(2, "0")}`, amount: String(day) }), image: null });
    const first = await s.list.execute("1");
    expect(first).toMatchObject({ total: 12, page: 1, lastPage: 2, redirectTo: null });
    expect(first.items).toHaveLength(10);
    expect(first.items.map((r) => r.date)).toEqual([...first.items.map((r) => r.date)].sort().reverse());
    expect(first.items[0].amount).toBe(11); // 11월 3일 중 마지막에 만든 것
    expect((await s.list.execute("2")).items).toHaveLength(2);
    for (const raw of [undefined, "0", "abc", "-1", "1.5"]) expect((await s.list.execute(raw)).page).toBe(1);
    expect((await s.list.execute("999")).redirectTo).toBe(2);
  });
});
