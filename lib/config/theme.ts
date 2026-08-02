/**
 * Semantic design constants — the numbers behind docs/design-system.md,
 * exposed for code that needs them as values (layout math, animation
 * libraries, conditional logic) rather than as a Tailwind class name.
 *
 * Deliberately excludes color, radius, shadow, and icon-size tokens: those
 * are already exposed as CSS custom properties in `app/globals.css` and
 * consumed via Tailwind utility classes (`bg-background`, `rounded-xl`,
 * `shadow-md`, `size-4`) — re-declaring them here would duplicate Tailwind
 * configuration, which docs/design-system.md and this task both call out
 * to avoid. What's here is either used outside Tailwind's class-based
 * styling entirely (aspect ratios in JS layout math, animation durations
 * passed to a motion library) or doesn't have a Tailwind utility of its
 * own yet (grid defaults, header height).
 *
 * Every value below cites the docs/design-system.md section it came from
 * — nothing here is invented independently of that document.
 */

/** docs/design-system.md, "Layout system" § Container widths. */
export const layout = {
  maxContentWidth: 1280,
  wideContainerWidth: 1600,
  /** ~65ch, converted to a pixel approximation for non-CSS consumers. */
  readingWidth: 720,
} as const;

/**
 * docs/design-system.md, "Layout system" § Page spacing (horizontal).
 * Each documented breakpoint gave a range; the lower bound of each is
 * used here as the single canonical value.
 */
export const containerPadding = {
  mobile: 16,
  tablet: 32,
  desktop: 48,
  largeDesktop: 64,
} as const;

/**
 * docs/design-system.md, "Spacing scale" — the tokens explicitly assigned
 * to section-level spacing (`2xl`/`3xl`/`4xl`). No distinct tablet value
 * is documented; it reuses the desktop step rather than inventing a new
 * number.
 */
export const sectionSpacing = {
  mobile: 48,
  tablet: 64,
  desktop: 64,
  largeDesktop: 96,
} as const;

/** docs/design-system.md, "Layout system" § Header & footer. */
export const headerHeight = {
  default: 72,
  compact: 56,
} as const;

/**
 * docs/design-system.md, "Layout system" § Header & footer — the footer
 * is treated as just another major section, so it reuses sectionSpacing
 * rather than defining its own scale.
 */
export const footerSpacing = sectionSpacing;

/**
 * docs/design-system.md, "Product card anatomy" § Image ratio. Expressed
 * as width/height rather than a CSS `aspect-ratio` string, so it stays a
 * plain number usable in layout math, not a CSS implementation detail.
 */
export const artworkAspectRatio = {
  width: 1,
  height: 1,
} as const;

/**
 * docs/design-system.md, "Layout system" § Grid spacing and "Responsive
 * strategy" (column counts implied per tier: single column on mobile,
 * two on tablet, three-to-four on desktop, four-to-five on large
 * desktop — the lower figure of each range is used as the default column
 * count, matching the "lower bound" rule used for containerPadding above).
 */
export const productGridDefaults = {
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    largeDesktop: 4,
  },
  gutter: {
    mobile: 16,
    tablet: 16,
    desktop: 24,
    largeDesktop: 24,
  },
} as const;

/**
 * docs/design-system.md, "Motion principles". Milliseconds, matching CSS
 * `transition-duration` and Tailwind's `duration-*` utilities — a
 * framer-motion consumer (`duration` is in seconds) should divide by 1000.
 */
export const animationDuration = {
  fast: 150,
  base: 200,
  slow: 300,
} as const;

/** docs/design-system.md, "Z-index scale". */
export const zIndex = {
  base: 0,
  sticky: 10,
  dropdown: 20,
  drawer: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
} as const;
