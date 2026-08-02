import Link from "next/link";
import { storeConfig, routes } from "@/lib/config";
import { cn } from "@/lib/utils";

export type LogoSize = "sm" | "md" | "lg";

/**
 * Matches Tailwind's default type scale exactly to docs/design-system.md's
 * heading hierarchy: `md` = H4 (1.25rem), `lg` = H3 (1.5rem). `sm` matches
 * Body Small (0.875rem) for compact contexts like the footer.
 */
const SIZE_CLASSES: Record<LogoSize, string> = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-2xl",
};

export interface LogoProps {
  /** @default "md" */
  size?: LogoSize;
  /** Pass `null` to render as plain text with no link (e.g. already on the homepage). @default routes.home */
  href?: string | null;
  className?: string;
}

/**
 * Text-based wordmark. Deliberately has no `text`/`label` prop — the
 * store name comes from `storeConfig` internally, so a future SVG/image
 * logo can replace this component's implementation without any caller
 * having to change how it's used (see docs/component-principles.md).
 */
export function Logo({ size = "md", href = routes.home, className }: LogoProps) {
  const wordmark = (
    <span
      data-slot="logo"
      className={cn(
        "font-semibold tracking-tight text-foreground",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {storeConfig.identity.shortName}
    </span>
  );

  if (href === null) {
    return wordmark;
  }

  return (
    <Link
      href={href}
      className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {wordmark}
    </Link>
  );
}
