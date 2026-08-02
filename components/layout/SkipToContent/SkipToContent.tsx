import { zIndex } from "@/lib/config";

export interface SkipToContentProps {
  /** Must match the `id` on the app's `<main>` landmark. @default "main-content" */
  targetId?: string;
}

/**
 * Standard skip-navigation link: visually hidden until it receives
 * keyboard focus, then jumps straight to the main content region —
 * lets keyboard/screen-reader users bypass the header and navigation on
 * every page. Must be the first focusable element in the document
 * (see Shell, which renders it before Header).
 */
export function SkipToContent({ targetId = "main-content" }: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      data-slot="skip-to-content"
      // Reuses the highest z-index tier (`toast`) — a focused skip link
      // must sit above everything, including the sticky header, and
      // there's no dedicated token for this one-off, always-on-top case.
      style={{ zIndex: zIndex.toast }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-3 focus:ring-ring/50"
    >
      Skip to content
    </a>
  );
}
