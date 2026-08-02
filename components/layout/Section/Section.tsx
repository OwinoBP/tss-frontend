import type { ReactNode } from "react";
import { sectionSpacing } from "@/lib/config";
import { cn, toResponsiveVars } from "@/lib/utils";

/**
 * - `default` — the full responsive Section Spacing scale
 *   (docs/design-system.md, "Spacing scale" — the `2xl`/`3xl`/`4xl` tier
 *   assigned to "major page sections"), sourced from `lib/config/theme.ts`.
 * - `subsection` — a single flat value matching the Spacing Scale's `xl`
 *   token (32px, "sub-section spacing") — not a theme.ts export, since
 *   Tailwind's own `py-8` already equals that documented value exactly.
 * - `none` — no vertical spacing, for a section that needs to control its
 *   own (e.g. nested inside another Section).
 */
export type SectionSpacing = "default" | "subsection" | "none";

export interface SectionProps {
  children: ReactNode;
  /** Renders an H2 above `children` — docs/design-system.md's heading
   * hierarchy assigns H2 to "major section heading," matching this
   * component's role. */
  heading?: string;
  /** @default "default" */
  spacing?: SectionSpacing;
  className?: string;
  headingClassName?: string;
}

/**
 * Consistent vertical rhythm between major page sections, with an
 * optional heading. Default spacing comes from `lib/config/theme.ts`
 * (see `Container` for why responsive theme values need
 * `toResponsiveVars` rather than a Tailwind arbitrary-value class).
 */
export function Section({
  children,
  heading,
  spacing = "default",
  className,
  headingClassName,
}: SectionProps) {
  const isDefault = spacing === "default";

  return (
    <section
      data-slot="section"
      data-spacing={spacing}
      style={
        isDefault
          ? toResponsiveVars("section-spacing", sectionSpacing)
          : undefined
      }
      className={cn(
        isDefault && [
          "py-(--section-spacing-mobile)",
          "md:py-(--section-spacing-tablet)",
          "lg:py-(--section-spacing-desktop)",
          "2xl:py-(--section-spacing-large-desktop)",
        ],
        spacing === "subsection" && "py-8",
        className,
      )}
    >
      {heading ? (
        <h2
          className={cn(
            "mb-6 text-[2rem] leading-[1.2] font-semibold tracking-[-0.01em] text-foreground",
            headingClassName,
          )}
        >
          {heading}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
