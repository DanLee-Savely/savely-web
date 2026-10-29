"use client";

import { CheckIcon, ChevronRightIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, type RefObject } from "react";
import { AppButton } from "@/components/common/AppButton";
import { BreakText } from "@/components/common/BreakText";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { homeContent } from "@/content/home.content";
import type { WaitlistErrorCode } from "@/domain/waitlist/WaitlistResult";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWaitlistForm } from "@/hooks/useWaitlistForm";
import { cn } from "@/lib/utils";

const copy = homeContent.waitlistDialog;
const { a11y, footer } = homeContent;

const errorText = (code: WaitlistErrorCode) =>
  code === "INVALID_EMAIL" ? copy.errors.invalidEmail : code === "CONSENT_REQUIRED" ? copy.errors.consentRequired : copy.errors.network;

type Props = { source: WaitlistSource | null; onClose: () => void };

// I8 출시 알림 신청 창 — PC 가운데 모달(480) · 모바일 바텀시트. 열리면 이메일 칸에 포커스, 닫히면 연 버튼으로 포커스 복귀
export function WaitlistDialog({ source, onClose }: Props) {
  const pc = useMediaQuery("(min-width: 1024px)");
  const keyboard = useKeyboardInset();
  const email = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  // Trigger 없이 여는 창이라 연 버튼을 직접 기억했다가 닫힐 때 포커스를 돌려준다
  const shared = {
    onOpenAutoFocus: (e: Event) => {
      e.preventDefault();
      opener.current = document.activeElement as HTMLElement | null;
      email.current?.focus();
    },
    onCloseAutoFocus: (e: Event) => {
      e.preventDefault();
      opener.current?.focus();
    },
  };
  const form = <WaitlistForm source={source} onClose={onClose} emailRef={email} pc={pc} />;
  const onOpenChange = (open: boolean) => !open && onClose();

  return pc ? (
    <Dialog open={source !== null} onOpenChange={onOpenChange}>
      <DialogContent
        {...shared}
        showCloseButton={false}
        className="block max-w-[480px] rounded-[20px] border border-sv-border bg-sv-surface px-8 pt-7 pb-8 ring-0 duration-250 sm:max-w-[480px]"
      >
        {form}
      </DialogContent>
    </Dialog>
  ) : (
    <Sheet open={source !== null} onOpenChange={onOpenChange}>
      <SheetContent
        {...shared}
        side="bottom"
        showCloseButton={false}
        // 키보드가 열리면 그 위로 올리고, 보이는 영역보다 길면 시트 안에서 스크롤
        style={keyboard.height ? { bottom: keyboard.inset, maxHeight: keyboard.height - 8 } : undefined}
        className="gap-5 overflow-y-auto overscroll-contain rounded-t-3xl border border-b-0 border-sv-border bg-sv-surface px-5 pt-3 pb-8 shadow-none"
      >
        <span aria-hidden className="mx-auto h-1 w-10 rounded-sm bg-sv-border-2" />
        {form}
      </SheetContent>
    </Sheet>
  );
}

type FormProps = Props & { emailRef: RefObject<HTMLInputElement | null>; pc: boolean };

function WaitlistForm({ source, onClose, emailRef, pc }: FormProps) {
  const { flow, typeEmail, setConsent, submit } = useWaitlistForm(source);
  const [details, setDetails] = useState(false);
  const id = useId();
  const Title = pc ? DialogTitle : SheetTitle;
  const Description = pc ? DialogDescription : SheetDescription;
  const close = (
    <button
      type="button"
      aria-label={a11y.dialogClose}
      onClick={onClose}
      className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-sv-surface-2 text-sv-text-2 outline-none focus-visible:ring-2 focus-visible:ring-sv-accent"
    >
      <XIcon className="size-4" strokeWidth={1.75} />
    </button>
  );

  if (flow.status === "done")
    return (
      <div className="flex flex-col gap-5">
        <div className="flex">{close}</div>
        <span className="flex size-14 items-center self-start justify-center rounded-full bg-sv-accent text-sv-on-accent">
          <CheckIcon className="size-6" strokeWidth={2.25} />
        </span>
        <Title className="sv-text-title-section-20 text-sv-text">{copy.doneTitle}</Title>
        <Description className="sv-text-body-15 text-sv-text-2">
          <BreakText text={copy.doneDesc.replace("{email}", flow.email.trim())} />
        </Description>
        <AppButton variant="secondary" size="l" className="w-full" onClick={onClose} autoFocus>
          {copy.doneConfirm}
        </AppButton>
      </div>
    );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center">
          <Title className="sv-text-title-section-20 text-sv-text">{copy.title}</Title>
          {close}
        </div>
        <Description className="sv-text-body-15 text-sv-text-2">{copy.desc}</Description>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-email`} className="sv-text-label-13 text-sv-text-2">
            {copy.emailLabel}
          </label>
          <input
            ref={emailRef}
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            value={flow.email}
            onChange={(e) => typeEmail(e.target.value)}
            aria-invalid={flow.error === "INVALID_EMAIL" || undefined}
            aria-describedby={flow.error ? `${id}-error` : undefined}
            className={cn(
              "rounded-xl border bg-sv-surface-2 px-4 py-3.5 sv-text-body-15 text-sv-text outline-none placeholder:text-sv-text-3 focus:border-sv-accent",
              flow.email ? "border-sv-accent" : "border-sv-border",
              flow.error === "INVALID_EMAIL" && "border-sv-danger focus:border-sv-danger",
            )}
          />
          {flow.error && (
            <p id={`${id}-error`} role="alert" className="sv-text-support-13 text-sv-danger">
              {errorText(flow.error)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id={`${id}-consent`}
            checked={flow.consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="size-5 rounded-[6px] border-sv-border-2 bg-sv-surface-2 data-checked:border-sv-accent data-checked:bg-sv-accent data-checked:text-sv-on-accent"
          />
          <label htmlFor={`${id}-consent`} className="flex-1 sv-text-support-14_5 text-sv-text-2">
            {copy.consent}
          </label>
          <button
            type="button"
            aria-expanded={details}
            aria-controls={`${id}-details`}
            onClick={() => setDetails(!details)}
            className="rounded-sm sv-text-support-13 text-sv-accent outline-none focus-visible:ring-2 focus-visible:ring-sv-accent"
          >
            {details ? copy.consentHide : copy.consentView}
          </button>
        </div>
        <p className="sv-text-support-13 text-sv-text-3">{copy.consentSummary}</p>
        {details && (
          <div id={`${id}-details`} className="flex flex-col gap-1 rounded-xl bg-sv-surface-2 px-4 py-3 sv-text-support-13 text-sv-text-2">
            <ul>
              {copy.consentDetails.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Link href={footer.privacyLink.href} className="flex w-fit items-center text-sv-accent hover:underline">
              {copy.consentPrivacyLink}
              <ChevronRightIcon aria-hidden className="size-3.5" />
            </Link>
          </div>
        )}
        <AppButton type="submit" size="l" className="w-full" disabled={!flow.canSubmit}>
          {flow.status === "submitting" && <LoaderCircleIcon aria-hidden className="size-4 animate-spin" />}
          {flow.status === "submitting" ? copy.submitting : copy.submit}
        </AppButton>
      </div>
    </form>
  );
}
