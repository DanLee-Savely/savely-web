import { describe, expect, it } from "vitest";
import { WaitlistFormFlow } from "./WaitlistFormFlow";

const filled = () => new WaitlistFormFlow().typeEmail("a@b.co").setConsent(true);

describe("WaitlistFormFlow", () => {
  it("이메일 형식과 동의가 모두 맞아야 입력됨(버튼 활성)", () => {
    const f = new WaitlistFormFlow();
    expect(f.status).toBe("idle");
    expect(f.typeEmail("a@b.co").status).toBe("idle");
    expect(f.setConsent(true).typeEmail("a@b").canSubmit).toBe(false);
    expect(filled()).toMatchObject({ status: "filled", canSubmit: true });
  });

  it("제출 → 전송 중 → 완료", () => {
    const sending = filled().submit();
    expect(sending).toMatchObject({ status: "submitting", canSubmit: false });
    expect(sending.typeEmail("x@y.zz").email).toBe("a@b.co");
    expect(sending.succeed().status).toBe("done");
  });

  it("실패하면 오류를 보여 주고, 다시 입력하면 오류가 지워진다", () => {
    const failed = filled().submit().fail("NETWORK");
    expect(failed).toMatchObject({ status: "error", error: "NETWORK", canSubmit: true });
    expect(failed.typeEmail("c@d.co")).toMatchObject({ status: "filled", error: null });
  });

  it("입력 조건이 안 맞으면 submit은 그대로", () => {
    const f = new WaitlistFormFlow().typeEmail("a@b.co");
    expect(f.submit()).toBe(f);
  });
});
