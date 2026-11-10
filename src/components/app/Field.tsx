import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { appContent } from "@/content/app.content";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  /** 칩 묶음처럼 label로 가리킬 입력 칸이 하나가 아닐 때 */
  group?: boolean;
  aside?: ReactNode;
  error?: string | null;
  children: ReactNode;
};

// 폼 칸 틀: 이름(+필수) · 오른쪽 보조(글자 수) · 입력 · 오류 문구. 입력은 aria-describedby로 `${id}-error`를 가리킨다
export function Field({ id, label, required, group, aside, error, children }: FieldProps) {
  const name = (
    <>
      {label}
      {required && <span className="ml-1.5 text-sv-accent">{appContent.form.required}</span>}
    </>
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between sv-text-label-13 text-sv-text-2">
        {group ? <span id={`${id}-label`}>{name}</span> : <label htmlFor={id}>{name}</label>}
        {aside}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 sv-text-support-13 text-sv-danger">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** 입력 칸 공통 모양 (오류면 빨간 테두리) */
export const inputClass = (invalid: boolean) =>
  `w-full rounded-sv-md border bg-sv-surface px-4 text-sv-text outline-none placeholder:text-sv-text-3 focus:border-sv-accent disabled:opacity-60 ${
    invalid ? "border-sv-danger" : "border-sv-border-2"
  }`;
