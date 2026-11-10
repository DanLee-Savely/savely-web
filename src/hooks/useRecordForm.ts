"use client";

import { useEffect, useRef, useState } from "react";
import type { RecordActionResult } from "@/app/app/records/actions";
import { DomainError } from "@/domain/DomainError";
import { InvalidImageTypeError } from "@/domain/record/errors";
import { ImageFile } from "@/domain/record/ImageFile";
import type { RecordDraft, RecordField } from "@/domain/record/RecordEntry";
import { clock } from "@/infrastructure/container";
import { RecordFormFlow } from "@/interaction/RecordFormFlow";
import { resizeImage } from "@/lib/resizeImage";

const focus = (field: RecordField | null) => {
  const el = field && document.getElementById(`field-${field}`);
  el?.focus({ preventScroll: true });
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
};

/** 고른 파일 검사(앞 12바이트 · 크기, 같은 도메인 클래스) → 통과하면 줄여 다시 저장 */
const prepare = async (file: File): Promise<Blob> => {
  ImageFile.inspect(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.size);
  return resizeImage(file).catch(() => Promise.reject(new InvalidImageTypeError()));
};

// RecordFormFlow · 사진을 기록 폼에 연결하는 얇은 어댑터. 저장 성공이면 Action이 상세로 이동시킨다
// existingImage: 수정 화면의 기존 사진 주소. 지우면 removeImage=1을 보낸다
export function useRecordForm(initial: RecordDraft, action: (data: FormData) => Promise<RecordActionResult>, existingImage: string | null) {
  const [flow, setFlow] = useState(() => new RecordFormFlow(initial));
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [keepExisting, setKeepExisting] = useState(!!existingImage);
  // 화면이 다시 그려지기 전에 들어온 두 번째 클릭도 막는다(두 번 저장 방지)
  const sending = useRef(false);

  useEffect(() => () => void (photo && URL.revokeObjectURL(photo.url)), [photo]);

  const pickImage = async (file: File) => {
    if (flow.locked) return;
    try {
      const blob = await prepare(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      setFlow((f) => f.pickImage(null));
    } catch (e) {
      if (!(e instanceof DomainError)) throw e;
      setFlow((f) => f.pickImage(e.code));
    }
  };

  const removeImage = () => {
    setPhoto(null);
    setKeepExisting(false);
  };

  const submit = async () => {
    if (sending.current) return;
    const next = flow.submit(clock);
    setFlow(next);
    if (next.status !== "submitting") return focus(next.firstErrorField);
    sending.current = true;
    const data = new FormData();
    for (const [k, v] of Object.entries(next.draft)) data.set(k, v);
    if (photo) data.set("image", photo.blob, "photo.jpg");
    if (existingImage && !keepExisting && !photo) data.set("removeImage", "1");
    // 서버에 닿지 못한 경우(오프라인 등)도 저장 실패(E10)로 보여 준다
    const result = await action(data).catch((): RecordActionResult => ({ formError: "SERVER_ERROR" }));
    if (!result) return; // 성공: 이동 중이라 잠금을 유지
    sending.current = false;
    const failed = next.fail(result.errors ?? {}, result.formError ?? null);
    setFlow(failed);
    focus(failed.firstErrorField);
  };

  return {
    flow,
    preview: photo?.url ?? (keepExisting ? existingImage : null),
    set: (field: keyof RecordDraft, value: string) => setFlow((f) => f.set(field, value)),
    setKind: (kind: string) => setFlow((f) => f.setKind(kind)),
    pickImage,
    removeImage,
    submit,
  };
}
