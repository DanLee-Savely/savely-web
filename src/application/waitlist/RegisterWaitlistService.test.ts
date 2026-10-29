import { describe, expect, it } from "vitest";
import { ConsentRequiredError, InvalidEmailError } from "@/domain/waitlist/errors";
import { InMemoryWaitlistRepository } from "@/infrastructure/waitlist/InMemoryWaitlistRepository";
import { RegisterWaitlistService } from "./RegisterWaitlistService";

const setup = () => {
  const repository = new InMemoryWaitlistRepository();
  return { repository, service: new RegisterWaitlistService(repository, () => new Date("2026-10-29T00:00:00Z")) };
};

describe("RegisterWaitlistService", () => {
  it("신규는 created, 같은 이메일(대소문자 · 공백 차이 포함)은 duplicate로 한 번만 저장한다", async () => {
    const { repository, service } = setup();
    expect(await service.execute({ email: "a@b.co", consent: true, source: "hero" })).toBe("created");
    expect(await service.execute({ email: " A@B.CO ", consent: true, source: "gnb" })).toBe("duplicate");
    expect(repository.size).toBe(1);
  });

  it("동의하지 않으면 저장하지 않는다", async () => {
    const { repository, service } = setup();
    await expect(service.execute({ email: "a@b.co", consent: false, source: null })).rejects.toThrow(ConsentRequiredError);
    expect(repository.size).toBe(0);
  });

  it("이메일 형식이 틀리면 저장하지 않는다", async () => {
    const { repository, service } = setup();
    await expect(service.execute({ email: "nope", consent: true, source: null })).rejects.toThrow(InvalidEmailError);
    expect(repository.size).toBe(0);
  });
});
