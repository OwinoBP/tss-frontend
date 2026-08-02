import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";

export interface ShellProps {
  children: ReactNode;
}

/**
 * The application shell every page renders inside: SkipToContent, then
 * Header, then the page's own content inside the one `<main>` landmark,
 * then Footer. Generic on purpose — no props beyond `children`, no
 * commerce or page-specific logic. See `app/layout.tsx` for where this
 * is wired into the App Router root layout.
 *
 * `id="main-content"` matches `SkipToContent`'s default target — this is
 * the one `<main>` landmark for every page; a page's own content must not
 * render a second `<main>` (see docs/decisions.md — three existing pages
 * needed a small `<main>` -> `<div>` fix for exactly this reason when
 * this Shell was wired into the root layout).
 */
export function Shell({ children }: ShellProps) {
  return (
    <>
      <SkipToContent />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
