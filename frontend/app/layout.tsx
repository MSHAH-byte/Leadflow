import type { Metadata } from "next";
// Self-hosted via the `geist` package so builds never depend on Google Fonts.
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LeadFlow — AI Lead Qualification Workspace",
    template: "%s · LeadFlow",
  },
  description:
    "Turn messy inbound customer inquiries into structured, qualified leads and a ready-to-review response.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
