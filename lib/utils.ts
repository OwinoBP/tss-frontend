import { clsx, type ClassValue } from "clsx"
import type { CSSProperties } from "react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** A theme.ts value that varies across the project's four responsive tiers (see docs/design-system.md, "Responsive strategy"). */
export interface ResponsiveScale {
  mobile: number
  tablet: number
  desktop: number
  largeDesktop: number
}

/**
 * Converts a responsive px scale from `lib/config/theme.ts` into CSS
 * custom properties, keyed `--{name}-{tier}`.
 *
 * Tailwind can't statically see a dynamically interpolated arbitrary
 * value (`` `px-[${value}px]` `` never generates real CSS), so components
 * that must read a responsive value from theme.ts pair this with
 * Tailwind v4's custom-property syntax instead — e.g.
 * `px-(--container-padding-mobile) md:px-(--container-padding-tablet)` —
 * where the variable *names* are static (Tailwind can see those) and only
 * the *values*, set here via inline style, come from theme.ts.
 */
export function toResponsiveVars(
  name: string,
  scale: ResponsiveScale,
): CSSProperties {
  return {
    [`--${name}-mobile`]: `${scale.mobile}px`,
    [`--${name}-tablet`]: `${scale.tablet}px`,
    [`--${name}-desktop`]: `${scale.desktop}px`,
    [`--${name}-large-desktop`]: `${scale.largeDesktop}px`,
  } as CSSProperties
}
