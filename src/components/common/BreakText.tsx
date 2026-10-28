import { Fragment } from "react";

export type ResponsiveText = string | { readonly pc: string; readonly mobile: string };

const lines = (text: string) =>
  text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));

// content의 \n을 줄바꿈으로, pc/mobile 값은 lg(1024) 기준으로 나눠 그린다
export function BreakText({ text }: { text: ResponsiveText }) {
  if (typeof text === "string") return lines(text);
  return (
    <>
      <span className="lg:hidden">{lines(text.mobile)}</span>
      <span className="hidden lg:inline">{lines(text.pc)}</span>
    </>
  );
}
