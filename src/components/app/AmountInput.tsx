import { appContent } from "@/content/app.content";
import { inputClass } from "./Field";

// 숫자만 남기고 쉼표를 넣는다. 앞의 0은 지우되 「0」 하나는 남긴다(0원 오류를 보여 주기 위해). 13자리까지
const withCommas = (raw: string) => {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 13);
  return digits && Number(digits).toLocaleString("ko-KR");
};

type AmountInputProps = { id: string; value: string; onChange: (v: string) => void; invalid: boolean };

// 금액 입력: 큰 숫자 글꼴 + 오른쪽 「원」
export function AmountInput({ id, value, onChange, invalid }: AmountInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        name="amount"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(withCommas(e.target.value))}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={`${inputClass(invalid)} h-15 border-2 pr-12 sv-text-amount-40`}
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 sv-text-label-15 text-sv-text-2">
        {appContent.form.won}
      </span>
    </div>
  );
}
