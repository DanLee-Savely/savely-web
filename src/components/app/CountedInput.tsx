import { Field, inputClass } from "./Field";

type CountedInputProps = {
  id: string;
  label: string;
  max: number;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  placeholder: string;
  multiline?: boolean;
};

// 글자 수 표시 입력(내용 60 · 메모 200). 넘겨 쓸 수 있게 막지 않고 오류로 알린다(E5 · E6)
export function CountedInput({ id, label, max, value, onChange, error, placeholder, multiline }: CountedInputProps) {
  const count = [...value].length;
  const props = {
    id,
    value,
    placeholder,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
  return (
    <Field
      id={id}
      label={label}
      error={error}
      aside={<span className={`sv-text-mono-13 ${count > max ? "text-sv-danger" : "text-sv-text-3"}`}>{`${count} / ${max}`}</span>}
    >
      {multiline ? (
        <textarea {...props} rows={3} className={`${inputClass(!!error)} resize-none py-3 sv-text-body-15`} />
      ) : (
        <input {...props} autoComplete="off" className={`${inputClass(!!error)} h-11.5 sv-text-body-15`} />
      )}
    </Field>
  );
}
