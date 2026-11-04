import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { homeContent } from "@/content/home.content";

// 금액 · 숫자용. tokens.css의 --sv-font-mono가 이 변수를 쓴다
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const { meta, footer } = homeContent;

export const metadata: Metadata = {
  metadataBase: new URL(`https://${footer.site}`),
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    siteName: footer.company,
    locale: "ko_KR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={jetbrainsMono.variable}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
