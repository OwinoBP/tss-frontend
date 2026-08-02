import { Logo } from "@/components/common/Logo";
import { Navigation } from "@/components/layout/Navigation";
import { Container } from "@/components/layout/Container";
import { headerHeight, zIndex } from "@/lib/config";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  /** Switches to the compact height tier — for a future scroll-triggered "compress" behavior (see docs/design-system.md, Navigation Principles). Purely presentational here; no scroll listener is wired up. @default false */
  compact?: boolean;
  /** @default true */
  sticky?: boolean;
  className?: string;
}

/**
 * Composes Logo + Navigation. No page-specific logic — every page gets
 * the same Header. `sticky` uses CSS `position: sticky` only, so this
 * stays a Server Component (a scroll-triggered `compact` toggle would
 * need a Client Component wrapper — deliberately not built here, see
 * follow-up recommendations).
 */
export function Header({ compact = false, sticky = true, className }: HeaderProps) {
  return (
    <header
      data-slot="header"
      style={{
        minHeight: compact ? headerHeight.compact : headerHeight.default,
        zIndex: sticky ? zIndex.sticky : undefined,
      }}
      className={cn(
        "flex items-center border-b border-border bg-background",
        sticky && "sticky top-0",
        className,
      )}
    >
      <Container className="flex w-full items-center justify-between gap-6">
        <Logo />
        <Navigation />
      </Container>
    </header>
  );
}
