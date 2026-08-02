import type { ReactNode } from "react";
import { layout, containerPadding } from "@/lib/config";
import { cn, toResponsiveVars } from "@/lib/utils";

/**
 * The three container widths documented in docs/design-system.md,
 * "Layout system" § Container widths.
 */
export type ContainerVariant = "content" | "wide" | "reading";

const MAX_WIDTH: Record<ContainerVariant, number> = {
  content: layout.maxContentWidth,
  wide: layout.wideContainerWidth,
  reading: layout.readingWidth,
};

export interface ContainerProps {
  children: ReactNode;
  /** @default "content" */
  variant?: ContainerVariant;
  className?: string;
}

/**
 * Consistent content width, responsive horizontal padding, and centered
 * alignment — the base every page section is built on. Values come from
 * `lib/config/theme.ts`, never hardcoded here; see `toResponsiveVars`
 * (`lib/utils.ts`) for why padding is applied via CSS custom properties
 * rather than a Tailwind arbitrary-value class.
 */
export function Container({
  children,
  variant = "content",
  className,
}: ContainerProps) {
  return (
    <div
      data-slot="container"
      data-variant={variant}
      style={{
        maxWidth: MAX_WIDTH[variant],
        ...toResponsiveVars("container-padding", containerPadding),
      }}
      className={cn(
        "mx-auto w-full",
        "px-(--container-padding-mobile)",
        "md:px-(--container-padding-tablet)",
        "lg:px-(--container-padding-desktop)",
        "2xl:px-(--container-padding-large-desktop)",
        className,
      )}
    >
      {children}
    </div>
  );
}
