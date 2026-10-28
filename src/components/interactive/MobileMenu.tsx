"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";
import { Logo } from "@/components/common/Logo";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { homeContent } from "@/content/home.content";
import { useWaitlistDialog } from "./WaitlistDialogProvider";

const { mobileMenu, a11y } = homeContent;

// I9 모바일 메뉴 — 위에서 내려오는 시트
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { open: openWaitlist } = useWaitlistDialog();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="flex size-10 flex-col items-center justify-center gap-1 rounded-full lg:hidden">
        <span className="sr-only">{a11y.menuOpen}</span>
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden className="h-0.5 w-5 rounded-[1px] bg-sv-text" />
        ))}
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        aria-describedby={undefined}
        className="gap-2 rounded-b-3xl border-0 bg-sv-bg data-[side=top]:border-b-0 px-5 pt-3 pb-7 shadow-none data-open:duration-300 motion-reduce:animate-none lg:hidden"
      >
        <SheetTitle className="sr-only">{a11y.menu}</SheetTitle>
        <div className="flex items-center justify-between pt-1.5 pb-3.5">
          <Logo className="h-6" />
          <SheetClose className="flex size-10 items-center justify-center rounded-full bg-sv-surface text-sv-text-2">
            <XIcon className="size-4" />
            <span className="sr-only">{a11y.menuClose}</span>
          </SheetClose>
        </div>
        {mobileMenu.items.map((item) => (
          <a
            key={item.target}
            href={item.target}
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between border-b border-sv-border px-1 py-4 sv-text-title-section-20 text-sv-text"
          >
            {item.label}
            <span aria-hidden className="text-sv-text-3">
              →
            </span>
          </a>
        ))}
        <AppButton
          size="l"
          className="mt-5 w-full"
          onClick={() => {
            setIsOpen(false);
            openWaitlist("mobile-menu");
          }}
        >
          {mobileMenu.cta}
        </AppButton>
        <p className="sv-text-support-13 text-sv-text-3">{mobileMenu.note}</p>
      </SheetContent>
    </Sheet>
  );
}
