"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImageUploadError, InvalidRecordError, RecordNotFoundError } from "@/domain/record/errors";
import type { RecordDraft, RecordFieldErrors } from "@/domain/record/RecordEntry";
import { createRecordsServer } from "@/infrastructure/container";

// 기록 쓰기 Server Actions (70-mvp-records §3). FormData → 서비스, 도메인 오류 → code 결과. 문구 변환은 화면(errorMessage)이 한다
// 로그에는 오류 종류만 남긴다(금액 · 내용 · 메모 금지, §8-3)

export type RecordActionResult = { errors?: RecordFieldErrors; formError?: string };

const DRAFT_FIELDS: (keyof RecordDraft)[] = ["kind", "amount", "date", "categoryId", "title", "paymentMethod", "reason", "feeling", "memo"];

const readDraft = (f: FormData) => Object.fromEntries(DRAFT_FIELDS.map((k) => [k, String(f.get(k) ?? "")])) as RecordDraft;

const readImage = async (f: FormData): Promise<Uint8Array | null> => {
  const file = f.get("image");
  return file instanceof File && file.size > 0 ? new Uint8Array(await file.arrayBuffer()) : null;
};

/** 쓰기 요청 제한(M15). IP는 판단에만 쓰고 저장하지 않는다 */
const allowed = async (limiter: { allow: (ip: string) => Promise<boolean> }) =>
  limiter.allow((await headers()).get("cf-connecting-ip") ?? "local");

const toResult = (e: unknown): RecordActionResult => {
  if (e instanceof InvalidRecordError) return { errors: e.errors };
  if (e instanceof ImageUploadError) return { formError: e.code };
  console.error("[records] SAVE_FAILED", e instanceof Error ? e.name : typeof e);
  return { formError: "SERVER_ERROR" };
};

export async function createRecord(formData: FormData): Promise<RecordActionResult> {
  const server = await createRecordsServer();
  if (!(await allowed(server.limiter))) return { formError: "RATE_LIMITED" };
  let id: string;
  try {
    id = (await server.create.execute({ draft: readDraft(formData), image: await readImage(formData) })).id;
  } catch (e) {
    return toResult(e);
  }
  redirect(`/app/records/${id}?done=created`);
}

/** 수정: 그사이 지워졌으면 상세 주소로 보내 없는 기록 안내를 보여 준다 (§4-4) */
export async function updateRecord(id: string, formData: FormData): Promise<RecordActionResult> {
  const server = await createRecordsServer();
  if (!(await allowed(server.limiter))) return { formError: "RATE_LIMITED" };
  try {
    await server.update.execute({ id, draft: readDraft(formData), image: await readImage(formData), removeImage: formData.get("removeImage") === "1" });
  } catch (e) {
    if (!(e instanceof RecordNotFoundError)) return toResult(e);
    redirect(`/app/records/${id}`);
  }
  redirect(`/app/records/${id}?done=updated`);
}

/** 삭제: 성공 · 이미 지워짐 모두 목록으로, 실패는 확인 창에 E11 (§4-5) */
export async function deleteRecord(id: string): Promise<RecordActionResult> {
  const server = await createRecordsServer();
  if (!(await allowed(server.limiter))) return { formError: "RATE_LIMITED" };
  let done = "deleted";
  try {
    await server.remove.execute(id);
  } catch (e) {
    if (!(e instanceof RecordNotFoundError)) {
      console.error("[records] DELETE_FAILED", e instanceof Error ? e.name : typeof e);
      return { formError: "DELETE_FAILED" };
    }
    done = "gone";
  }
  redirect(`/app/records?done=${done}`);
}
