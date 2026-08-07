# Design System

The authoritative reference for TSS Music Store's visual language. Every
future UI component, page, and layout decision should trace back to a rule
in this document rather than being decided ad hoc at implementation time.

This document defines the *system*. It does not implement it — no
components, pages, or Tailwind classes exist yet. See
[component-principles.md](component-principles.md) for how components
should be built once this system is implemented, and
[architecture.md](architecture.md) / [product-model.md](product-model.md)
for the data layer this UI sits on top of.

**Grounding note:** wherever a token described here already exists in code
(`app/globals.css`, `components/ui/*`), this document says so explicitly
and cites the real value. Wherever something is proposed but not yet
implemented, it's marked **(proposed)** — this document deliberately
doesn't pretend a token exists before it does.

---

## Design philosophy

Three commitments drive every decision below:

1. **The product is the content.** This is a marketplace for sample packs,
   drum kits, and presets — visually, that means artwork, waveforms, and
   typography carry the design. Chrome (nav, buttons, borders) should be
   quiet enough to disappear when it's not needed.
2. **Restraint reads as premium.** Loud color, heavy shadows, and dense
   layouts read as a discount storefront. Generous whitespace, a tight
   color palette, and confident typography read as curated. Every
   addition to the system should be justified against this — if a rule
   makes the UI louder without making it clearer, it doesn't belong.
3. **Consistency over novelty.** A component should never need a one-off
   spacing value, color, or animation curve. If this document doesn't have
   the token a component needs, that's a gap in this document to fix, not
   a license to improvise in the component.

## Visual principles

- **Editorial** — layouts read like a well-typeset magazine feature, not a
  dashboard. Clear hierarchy, deliberate pacing, real breathing room
  between ideas.
- **Artwork-first** — product imagery is the largest, highest-contrast
  element on any screen that features a product. UI chrome never competes
  with it for attention.
- **Generous whitespace** — whitespace is treated as a design element, not
  leftover space. See the Spacing Scale for how much and where.
- **Strong typography, restrained color** — hierarchy comes from type
  scale, weight, and spacing first; color is the last resort, used
  sparingly and deliberately (see Colour System).
- **Clean hierarchy** — every screen should have one obvious focal point.
  If two elements compete for attention, one of them is wrong.
- **Minimal distractions** — no decorative motion, no gratuitous borders,
  no shadows without a functional reason (see Motion and Shadow systems).
- **Responsive by design** — layouts are designed for their content and
  viewport from the start, not shrunk down from a fixed desktop design
  (see Responsive Strategy).

## Brand personality

| We are | We are not |
|---|---|
| Confident | Loud |
| Curatorial | Cluttered |
| Precise | Approximate |
| Warm-minimal | Cold/corporate |
| Craftsman-like | Trend-chasing |

The voice is that of someone who knows the catalog well and trusts the
product to speak for itself — closer to a record store owner's
recommendation than an ad. Confident, specific, unhurried. Never
exclamation-mark marketing copy, never artificial urgency ("Only 2 left!")
unless it's literally true and relevant.

---

## Typography system

### Font families

- **Primary (UI + body): Geist Sans.** Already loaded in
  `app/layout.tsx` via `next/font/google` (`--font-geist-sans`). A clean,
  modern grotesque — carries the "modern, editorial" quality without
  needing a second typeface. This is the safe, already-working default
  for everything: headings, body, UI labels.
- **Numerals + technical metadata: Geist Mono.** Also already loaded
  (`--font-geist-mono`). Use for anything tabular or precise — prices,
  BPM, duration, SKU-like identifiers, timestamps. Monospaced numerals
  give the catalog a "precise, curatorial" feel and make prices/specs
  easy to scan when several products are listed together.
- **(Proposed) Display serif for hero moments.** Geist Sans alone is
  sufficient and is the recommended default — but if the "editorial"
  quality needs to be pushed further (e.g. a large-format hero headline,
  a featured-story module), a single complementary serif used *only* at
  display size (never in UI or body copy) would sharpen that further. Not
  required; a deliberate future option, not a gap to fill immediately.

**Implementation note:** `app/globals.css`'s `@theme inline` block
currently defines `--font-sans: var(--font-sans)` — a self-reference that
doesn't resolve to the loaded Geist Sans variable
(`--font-geist-sans`). `--font-mono` is wired correctly
(`var(--font-geist-mono)`). This is a pre-existing wiring gap, not
something this documentation-only branch changes — flagged here so
whoever implements this system fixes it rather than rediscovering it.

### Font weights

Deliberately restrained to four weights — more than that starts to feel
like shouting, which contradicts "restrained, premium":

| Weight | Value | Usage |
|---|---|---|
| Regular | 400 | Body copy, descriptions, form input text |
| Medium | 500 | UI labels, captions, secondary emphasis, nav items |
| Semibold | 600 | Headings, product titles, primary emphasis |
| Bold | 700 | Reserved for rare, deliberate emphasis (e.g. a price on a sale badge) — not a default heading weight |

### Heading hierarchy

| Level | Size | Weight | Line height | Letter spacing | Usage |
|---|---|---|---|---|---|
| Display | 3.5rem–4.5rem (56–72px) | 600 | 1.05–1.1 | -0.02em | Hero moments only, at most once per page |
| H1 | 2.5rem (40px) | 600 | 1.15 | -0.015em | Page title (one per page) |
| H2 | 2rem (32px) | 600 | 1.2 | -0.01em | Major section heading |
| H3 | 1.5rem (24px) | 600 | 1.25 | -0.005em | Subsection heading, card group heading |
| H4 | 1.25rem (20px) | 500 | 1.3 | normal | Minor heading, product title in a detail view |

Sizes scale down roughly one step per breakpoint below desktop — see
Responsive Strategy. Headings never use color for hierarchy; size and
weight do the work so the hierarchy still reads correctly for anyone who
can't distinguish the accent color from body text.

### Body styles

| Style | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| Body Large | 1.125rem (18px) | 400 | 1.6 | Lead paragraphs, product descriptions |
| Body | 1rem (16px) | 400 | 1.6 | Default body copy |
| Body Small | 0.875rem (14px) | 400 | 1.5 | Secondary text, metadata rows, form helper text |

Body line height is generous (1.5–1.6) on purpose — it's the single
biggest contributor to a page feeling unhurried rather than dense.

### Caption styles

| Style | Size | Weight | Line height | Letter spacing | Usage |
|---|---|---|---|---|---|
| Caption | 0.75rem (12px) | 500 | 1.4 | normal | Timestamps, fine print, form field hints |
| Eyebrow/Label | 0.75rem (12px) | 600 | 1.4 | 0.08em, uppercase | Section labels ("FEATURED", "NEW ARRIVALS"), category eyebrows above a heading |

The eyebrow style is the one place uppercase + wide tracking is allowed —
everywhere else, body-case text with normal or tight tracking is the rule.
Wide-tracked uppercase used everywhere stops meaning anything; used only
for eyebrows, it's a reliable signal of "this is a section label."

---

## Colour system

Semantic tokens, not utility classes — components should reference
`text-primary` (a role) not `text-neutral-950` (a value). This is also how
the project's existing shadcn setup already works
(`app/globals.css` defines CSS custom properties consumed by Tailwind's
`@theme inline`), so this table maps each semantic role onto that existing
mechanism rather than inventing a parallel one.

| Semantic token | Purpose | Existing CSS variable | Status |
|---|---|---|---|
| **Background** | The page canvas. Everything sits on top of this. | `--background` | Exists |
| **Surface** | Elevated containers — cards, panels. One step "above" the background. | `--card` | Exists |
| **Surface Overlay** | Floating surfaces — popovers, dropdowns, tooltips. | `--popover` | Exists |
| **Text Primary** | Default text color — headings, body, anything that should be fully legible. | `--foreground` | Exists |
| **Text Secondary** | De-emphasized text — metadata, captions, helper text. Never used for anything that must be read; only for things that support the primary text. | `--muted-foreground` | Exists |
| **Accent** | The one interactive/brand color. Primary CTAs, active states, links, the sale-price emphasis. Used sparingly — see below. | `--primary` | Exists, currently neutral (near-black/white) — see recommendation below |
| **Accent Foreground** | Text/icon color on top of an Accent-colored surface. | `--primary-foreground` | Exists |
| **Secondary Action** | Lower-emphasis interactive surfaces — secondary buttons, selected filter chips. | `--secondary` | Exists |
| **Muted Fill** | Subtle background fills — disabled states, skeleton loaders, hover backgrounds on ghost elements. | `--muted` | Exists |
| **Border** | Dividers, card outlines, input borders. | `--border` | Exists |
| **Focus Ring** | Keyboard focus indicator. See Accessibility Principles. | `--ring` | Exists |
| **Success** | Confirmation states — order placed, item added. | `--success` / `--success-foreground` | **(proposed — not yet in globals.css)** |
| **Warning** | Caution states — low stock, sale ending soon. | `--warning` / `--warning-foreground` | **(proposed — not yet in globals.css)** |
| **Danger** | Errors, destructive actions, validation failures. | `--destructive` | Exists — `--destructive-foreground` is **not** yet defined; needed for text on a solid danger background |

### Why Accent is currently neutral, and what to do about it

The existing scaffold (`shadcn` "neutral" base color) ships with `--primary`
set to near-black/white — effectively no color at all. That's not
accidental-looking by coincidence; it's consistent with "restrained colour
palette" and "artwork-first": if the *interface* is monochrome, product
artwork is the only source of color on any given page, which is exactly
the hierarchy this system wants. Recommendation: **keep the interface
fundamentally grayscale**, and introduce exactly one accent hue used only
for functional emphasis (primary CTA, active/selected state, sale
indicator) — not as a decorative brand wash across the UI.

**(Proposed)** A warm, low-saturation gold/amber (`oklch(0.7 0.15 75)` light
/ `oklch(0.78 0.15 75)` dark, as a starting point) reads as premium and
faintly evokes analog audio gear (brass, vinyl) without being loud. This
is a starting recommendation for implementation, not a final brand
decision — actual hue selection should be signed off with real product
photography in view, since "artwork-first" means the accent must not
compete with whatever color the catalog's imagery happens to be.

### Proposed additions (starting values, pending sign-off)

Given as concrete, usable defaults so implementation isn't blocked — not
as final values. Chosen to match the lightness/chroma character of the
existing `--destructive` token (`oklch(0.577 0.245 27.325)` light /
`oklch(0.704 0.191 22.216)` dark) so all three semantic colors read as one
consistent family:

| Token | Light | Dark |
|---|---|---|
| `--success` | `oklch(0.6 0.14 152)` | `oklch(0.72 0.16 152)` |
| `--success-foreground` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` |
| `--warning` | `oklch(0.75 0.16 80)` | `oklch(0.8 0.16 80)` |
| `--warning-foreground` | `oklch(0.145 0 0)` | `oklch(0.145 0 0)` |
| `--destructive-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |

Warning's foreground stays dark text in both modes — amber/yellow hues
stay perceptually light even in a "dark" token, so dark text remains the
higher-contrast choice either way.

### Usage rule

Color communicates *state*, never *decoration*. If removing a color from
an element wouldn't lose any information (it's just "for interest"),
remove it.

---

## Spacing scale

Base unit: **4px (0.25rem)** — the same primitive Tailwind v4 already uses
for its default spacing scale (`--spacing`), so this system rides on top
of Tailwind's existing mechanism rather than introducing a competing one.
Every spacing value below is a multiple of that unit.

| Token | Value | Usage |
|---|---|---|
| `3xs` | 2px | Hairline gaps — icon glyph to its own tight label |
| `2xs` | 4px | Tightest rhythm — within a single tightly-related metadata line |
| `xs` | 8px | Inline related elements — icon-to-label gap, badge internal padding |
| `sm` | 12px | Small component padding, gap between stacked lines of related text |
| `md` | 16px | Default component padding, gap between a card's artwork and its metadata block |
| `lg` | 24px | Gap between distinct components in a section, product grid gutter (desktop) |
| `xl` | 32px | Sub-section spacing |
| `2xl` | 48px | Spacing between major page sections (mobile) |
| `3xl` | 64px | Spacing between major page sections (desktop) |
| `4xl` | 96px | Hero/section breathing room, large desktop section spacing |
| `5xl` | 128px | Top-level editorial "air" — large desktop only |

**The rhythm:** spacing grows roughly geometrically, not linearly, as the
relationship between two elements gets more distant. Tight spacing (`3xs`–`sm`)
says "these belong together"; generous spacing (`2xl`–`5xl`) says "these
are different ideas." A component should never need a value outside this
scale — if it seems to, that's a sign the layout's hierarchy needs
rethinking, not a one-off pixel value.

---

## Radius system

Already defined in `app/globals.css`, base `--radius: 0.625rem` (10px)
with derived steps:

| Token | Formula | Value | Usage |
|---|---|---|---|
| `radius-sm` | `radius * 0.6` | 6px | Tight controls — checkboxes, small chips |
| `radius-md` | `radius * 0.8` | 8px | Inputs, small buttons |
| `radius-lg` | `radius * 1.0` | 10px | Default buttons, standard controls |
| `radius-xl` | `radius * 1.4` | 14px | Cards, panels |
| `radius-2xl` | `radius * 1.8` | 18px | Larger cards, feature modules |
| `radius-3xl` | `radius * 2.2` | 22px | Hero/large containers |
| `radius-4xl` | `radius * 2.6` | 26px | Largest containers, rarely used |
| `rounded-full` | — | 9999px | Pills, badges, avatars, circular icon buttons (standard Tailwind utility, no custom token needed) |

A single `--radius` base means the whole system's "roundedness" can be
tuned in one place later without touching every component — already true
of the existing scaffold, worth preserving rather than hardcoding
per-component radii.

---

## Shadow system

**(Proposed — no shadow tokens exist in `app/globals.css` yet.)** Kept
deliberately subtle — heavy shadows read as busy and contradict "minimal
distractions." Shadows exist to indicate elevation, never for decoration.

| Token | Value (light mode) | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.04)` | Inputs, small controls — barely-there separation |
| `shadow-md` | `0 2px 8px rgb(0 0 0 / 0.06)` | Resting card elevation |
| `shadow-lg` | `0 8px 24px rgb(0 0 0 / 0.08)` | Hover elevation, dropdowns, popovers |
| `shadow-xl` | `0 16px 48px rgb(0 0 0 / 0.12)` | Modals, dialogs |

**Dark mode:** shadows read poorly on dark backgrounds (they mostly
disappear or look muddy). Prefer a subtle border or a one-step-lighter
surface color to indicate elevation in dark mode rather than a darker
shadow — reduce shadow opacity further if one is used at all, don't just
reuse the light-mode values.

---

## Z-index scale

**(Proposed — no z-index tokens exist in `app/globals.css` yet.)** A fixed,
sparse scale — gaps are left between each step deliberately, so a future
layer can be inserted without renumbering everything else.

| Token | Value | Usage |
|---|---|---|
| `base` | 0 | Default stacking — ordinary page content |
| `sticky` | 10 | Sticky header/nav |
| `dropdown` | 20 | Dropdowns, popovers, select menus |
| `drawer` | 30 | Mobile navigation drawer, filter drawer |
| `overlay` | 40 | Modal/dialog backdrop |
| `modal` | 50 | Modal/dialog content |
| `toast` | 60 | Notifications/toasts — must stay above everything, including an open modal |

---

## Icon sizing

Icon library: **lucide-react** (already configured — see `components.json`).
Sizes align with what's already used in the existing button component
(`components/ui/button.tsx` sizes icons at `size-3`/`size-3.5`/`size-4`
depending on button size):

| Token | Size | Usage |
|---|---|---|
| `xs` | 12px | Dense inline contexts — small badges, compact buttons |
| `sm` | 14px | Compact UI, small buttons |
| `default` | 16px | Most UI icons — body-text-adjacent, form fields |
| `md` | 20px | Standalone icons, nav icons |
| `lg` | 24px | Feature icons, empty-state illustrations |
| `xl` | 32px+ | Large decorative/illustrative icons only |

Stroke width: Lucide's default (2px) is the standard. At `lg`/`xl` sizes,
a lighter stroke (1.5px) reads more refined and can be used deliberately —
not a rule to apply everywhere, just an option for large-format icons.

---

## Layout system

### Container widths

| Container | Max width | Usage |
|---|---|---|
| Reading width | ~65ch (~720px) | Long-form text — product descriptions, editorial copy. Optimized for readability, not screen-filling. |
| Content container | 1280px | Standard page content — product grids, most page bodies |
| Wide container | 1600px | Editorial full-bleed sections, large hero imagery |

### Page spacing (horizontal)

| Breakpoint | Padding |
|---|---|
| Mobile | 16–20px |
| Tablet | 32px |
| Desktop | 48–64px |
| Large desktop | 64–96px |

### Section spacing (vertical, between major page sections)

Uses the Spacing Scale's largest tokens: `2xl` (48px) on mobile scaling up
to `4xl`–`5xl` (96–128px) on large desktop. Section spacing should always
be visibly larger than the spacing *within* a section — that contrast is
what makes "section" legible as a concept at all.

### Grid spacing

Product grid gutters: `lg` (24px) on desktop, `md`–`sm` (12–16px) on
mobile — grids get tighter on small screens where every pixel of width
matters more than breathing room.

### Header & footer

| Element | Value | Usage |
|---|---|---|
| Header height (default) | 72px | Resting state — comfortable room for logo + primary nav |
| Header height (compact) | 56px | Scrolled state — the "compress rather than disappear" behaviour already described in Navigation Principles |
| Footer spacing | Section Spacing tokens (`2xl`–`4xl`, 48–96px) | The footer is treated as just another major page section, not a special case — its top/bottom padding uses the same tier as any other section boundary |

### Alignment rules

- **Left-align by default.** Body text, headings, and metadata are
  left-aligned — easier to scan, and the standard editorial convention.
  Center alignment is reserved for deliberate, occasional hero/marketing
  moments, never for body copy or repeating content (product grids,
  lists).
- **Consistent baseline alignment** between text and imagery in any
  row-based layout — a title shouldn't visually float relative to the
  artwork next to it.
- **One column of truth per breakpoint.** Content shouldn't reflow into
  an unrelated number of columns between adjacent breakpoints (e.g. 3 → 2
  → 4) — column counts should step predictably as width increases.

---

## Responsive strategy

Breakpoints follow Tailwind v4's defaults (already available, no new
tokens needed): `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.
Mapped to this system's four conceptual tiers:

| Tier | Range | Philosophy |
|---|---|---|
| **Mobile** | <768px | Single column. Navigation collapses to a drawer. Product cards go full-width, artwork-forward, with secondary metadata (e.g. category) willing to drop before primary metadata (title, price) does. Every interactive target meets the touch sizing minimum (see Accessibility). |
| **Tablet** | 768–1024px | Two-column grids become viable. Navigation may start becoming inline depending on how much fits without crowding — err toward the drawer if it's close. |
| **Desktop** | 1024–1536px | Three-to-four column grids. Full inline navigation. Hover states become meaningful, since a mouse is the primary input — but nothing important should be *hover-only* (see Motion Principles and Accessibility). |
| **Large desktop** | >1536px | Content stays inside the Wide Container (1600px) rather than stretching edge-to-edge — an ultra-wide viewport should get more margin, not smeared-out content. Four-to-five column grids at most; beyond that, cards get too small to be artwork-first. |

**Philosophy over implementation:** design mobile-first, but don't treat
breakpoints as the only variable that matters — the *primary interaction
mode* (touch vs. mouse/keyboard) changes at the same boundary and should
drive decisions as much as available width does. A hover-reveal
interaction designed for desktop needs a real touch-equivalent, not just a
smaller version of the same layout.

---

## Product card anatomy

Implemented in `components/commerce/ProductCard` (`feature/product-card`).
Every element below maps to a real `MusicProduct` field
(`types/music-product.ts`), reshaped by `product-card.mapper.ts` into the
`ProductCardProps` the component actually renders — see
[architecture.md](architecture.md) and [decisions.md](decisions.md) for
that mapping layer and the handful of judgment calls made while
implementing this spec (Product type as Caption-style text rather than a
`Badge`, since only `Badges` below is documented as pill-shaped; the
Badges row itself unused for now since nothing in this pass needed
`featured`/sale flags).

| Element | Source field | Notes |
|---|---|---|
| Artwork | `artwork` (`ProductImage \| null`) | Primary visual anchor — see Image Ratio below. **Must handle `null`**: `artwork` is nullable in the domain model (a product can legitimately have no image set) — the card needs a defined empty-state treatment (a quiet placeholder fill using `--muted`, not a broken-image icon), not an afterthought. |
| Title | `title` | Primary text — H4 weight/size (see Typography), one or two lines max, truncates rather than wraps past that. |
| Producer | `producer.name` | Secondary text, directly beneath title, Text Secondary color, Body Small size. |
| Product type | `productType` | Tertiary metadata — Caption style, often paired with other short specs (e.g. "DRUM KIT"). Note: currently mapped to a placeholder value for every product until a real WooCommerce source exists (see `docs/api/product-query.md`) — the card design shouldn't assume this is reliably differentiated data yet. |
| Pricing | `regularPrice`, `salePrice` | Geist Mono for the numerals (see Typography). When `salePrice` is present, show both: regular price de-emphasized (Text Secondary, often strikethrough), sale price emphasized (Text Primary or Accent). |
| Badges | Derived — `featured`, `salePrice !== null` | Small pill using the existing `Badge` component (`components/ui/badge.tsx`) rather than a new pattern. Placed on the artwork's corner (overlay) or inline above the title — pick one placement and use it everywhere, don't mix. |
| Hover behaviour | — | Subtle only: artwork scale to ~1.02–1.05, or a restrained overlay (e.g. a preview/play affordance, relevant once `previewUrl` is used). Title/price never move on hover. Timing per Motion Principles (150–200ms, ease-out). Must have a touch-equivalent — hover-only affordances are invisible on mobile. |
| Spacing | Spacing Scale | Card internal padding: `md` (16px). Gap between artwork and metadata block: `md` (16px). Gap between stacked metadata lines (title/producer/type): `2xs`–`xs` (4–8px) — tight, since these are one related group. Gap before price: `sm` (12px) — a slightly bigger gap signals "price is a distinct piece of information," not part of the descriptive stack above it. |
| Image ratio | — | **1:1 (square).** Matches the convention of album art and sample-pack cover art; keeps grids visually regular regardless of source image proportions. Artwork is `object-fit: cover`, never stretched. |

---

## Product detail anatomy

Implemented in `app/products/[slug]` + `components/commerce/ProductGallery`,
`ProductInfo`, `ProductMeta` (`feature/product-detail`). A richer view of
the same `MusicProduct` `ProductCard` summarizes — same restraint, same
artwork-first priority, more room to show it.

| Element | Source | Notes |
|---|---|---|
| Gallery | `artwork`, `gallery` | Primary image large, 1:1 (same Image Ratio rule as the card); additional `gallery` images shown as a smaller static row beneath. No click-to-swap/lightbox yet — see docs/decisions.md for why that's deferred rather than built against no real multi-image data to validate it. |
| Title | `title` | A semantic `<h1>` (one per page) but sized like **H4**, not Display/H1 — this is the one explicit typographic exception the Typography table already calls out ("product title in a detail view"), so artwork stays the visual focal point even on the page most about a single product. |
| Price | `regularPrice`, `salePrice` | Same regular/sale treatment as the card (Geist Mono, strikethrough + emphasis), rendered larger (`ProductPricing`'s `lg` size) since there's room and it's a primary decision point here, not secondary metadata. |
| Add to Cart | — (`AddToCartButton`, `feature/cart`) | Directly below `ProductInfo`, in the same info column — the page's one primary CTA (Button hierarchy's `default` variant, "at most one per view"). Adds a fixed quantity of 1; no quantity picker on this page for v1 — quantity is adjusted from `/cart` instead. |
| Description | `description` | Rendered as real HTML (WordPress-admin-authored WooCommerce content — see docs/decisions.md for the trust boundary), Body size, restrained list/paragraph spacing. Not shown on the card. |
| Meta | `producer`, `productType`, `categories`, `tags` | Grouped separately below price/description (`ProductMeta`), a simple label/value list — categories linked (a real route exists), tags plain (no tag-browsing route exists yet, not invented speculatively), producer linked only once real producer data exists (currently always a placeholder, same as the card). |
| Breadcrumbs | — | Home → Products → [title], per Navigation Principles below — this page is exactly the "more than two levels from home" case that rule describes. |
| Layout | — | Two columns at desktop/tablet (gallery, info), one column mobile — same responsive tiers as everywhere else in this system, no new breakpoint behavior. |

---

## Navigation principles

- **Quiet by default.** Navigation is a tool for getting somewhere, not a
  branding surface — it should never be visually louder than the content
  below it.
- **Two tiers, clearly separated.** Primary navigation (catalog sections)
  and utility navigation (search, cart, account) are visually distinct —
  utility items are smaller/lighter, primary items carry more typographic
  weight.
- **Understated active state.** Indicate the current section with weight
  or an underline, not a filled color block — consistent with the
  restrained color philosophy.
- **Sticky header, but not intrusive.** The header may stay accessible on
  scroll, but should compress or reduce its own height rather than
  permanently occupying a large fixed area.
- **Mobile collapses to a drawer**, not a hamburger-triggered full-screen
  takeover of the current view unless the drawer itself needs the whole
  screen for its own content.
- **Breadcrumbs for depth.** Any page more than two levels from home
  (e.g. Category → Product) gets a breadcrumb trail — text-only, Caption
  style, no decorative separators beyond a simple `/` or `›`.

---

## Button hierarchy

Maps directly onto the variants already implemented in
`components/ui/button.tsx` — this section is usage guidance for those
existing variants, not a new naming scheme:

| Variant (existing) | Role | Usage |
|---|---|---|
| `default` (primary) | The one primary action in a given context | "Add to Cart", "Checkout" — at most one per view/section |
| `secondary` | A meaningful but non-primary action | "Add to Wishlist" next to a primary "Add to Cart" |
| `outline` | Lower-emphasis action, often paired with a primary button | "Cancel" next to a "Save" |
| `ghost` | Lowest emphasis — icon buttons, toolbar actions, dismiss controls | Filter chip removal, dismiss/close icons |
| `link` | Inline, text-level actions | "View details", "See all" |
| `destructive` | Irreversible or data-removing actions | "Remove from cart", "Delete address" |

Sizing (`default`/`xs`/`sm`/`lg`/`icon` and `icon-*` variants, already
implemented): `default` for standard UI, `sm`/`xs` for dense contexts
(toolbars, inline table actions), `lg` reserved for a page's single most
important CTA. See Accessibility Principles regarding `xs`/`sm`/icon sizes
and the 44px touch target minimum — the smallest button sizes need extra
tap-area consideration on touch devices, not just visual sizing.

---

## Form styling principles

- **Label above field, always.** Never rely on placeholder text as a
  label — it disappears the moment a user starts typing.
- **Consistent focus treatment.** Inputs use the same focus-visible
  language already established on buttons (a visible ring using the Focus
  Ring token) — one consistent "this is focused" signal across every
  interactive element in the system, not a per-component decision.
- **Errors are explicit, not just colored.** A red border alone isn't
  sufficient (color-only signals fail colorblind users) — pair the Danger
  color with a text message and, where practical, an icon.
- **Helper text is Caption style**, sits directly below the field, and is
  Text Secondary colored unless it's an active error (then Danger).
- **Disabled state reduces opacity and removes interactivity cues**
  (no hover/focus styling) rather than just changing color — it should be
  unambiguous that a field can't be interacted with.
- **Spacing between fields** uses the `lg` (24px) spacing token; spacing
  between a label and its field uses `xs` (8px).

---

## Motion principles

- **Transitions:** 150–200ms for small UI state changes (hover, focus,
  toggles), 250–300ms for larger transitions (panel open/close, page
  section reveals). Nothing in this system should feel slow, and nothing
  should feel instant-and-jarring either.
- **Easing:** ease-out for anything entering or responding to user action
  (hover, click feedback); ease-in for anything exiting. No spring/bounce
  easing anywhere — bounce reads as playful/casual, which contradicts
  "premium, restrained."
- **Hover behaviour:** subtle scale (max ~1.05x) or opacity/color shifts
  only. Never movement that changes layout (no elements that grow and
  push their neighbors). Every hover effect needs a touch-device
  equivalent — see Responsive Strategy.
- **Loading behaviour:** prefer skeleton placeholders (shapes matching the
  eventual content, using the Muted Fill token) over spinners — a
  skeleton communicates "this is about to be a product card," which fits
  the editorial, content-first feel better than a generic spinner. A
  spinner is acceptable only for actions with no meaningful shape to
  skeleton (e.g. a form submission).
- **Respect `prefers-reduced-motion`.** Every transition and animation
  described here should be disabled or reduced to an instant/opacity-only
  change when the user has this preference set — not optional polish, a
  requirement.

---

## Accessibility principles

- **Keyboard navigation.** Every interactive element must be reachable
  and operable via keyboard alone, in a logical order matching visual
  layout. Include a skip-to-content link as the first focusable element
  on every page.
- **Focus visibility.** Focus must always be visible — extend the
  focus-visible ring pattern already established in
  `components/ui/button.tsx` (a visible ring using the Focus Ring token)
  to every interactive element project-wide, not just buttons. Never
  suppress the focus outline without providing an equally visible
  replacement.
- **Contrast expectations.** WCAG AA minimum: 4.5:1 for body text, 3:1
  for large text (18px+/14px+bold) and UI component boundaries. This is
  binding on the proposed Accent/Success/Warning color values above once
  a final hue is chosen — verify contrast against both `--background` and
  `--card` before shipping any color decision, not just against white.
- **Touch target sizing.** Minimum 44×44px for any touch-operable
  control, per WCAG/platform guidance. **Flag for implementation:** the
  existing `Button` component's default size is `h-8` (32px), and several
  icon sizes go smaller (`icon-xs` at 24px) — these are fine as *visual*
  sizes on desktop, but on touch contexts they need either a larger
  effective tap area (invisible padding beyond the visible button bounds)
  or a touch-specific minimum size. This should be resolved before any
  small/icon button ships in a touch-reachable context.

---

## References

- [component-principles.md](component-principles.md) — how components
  should be structured to implement this system
- [architecture.md](architecture.md) — folder structure, data flow, the
  `components/{ui,layout,commerce,music,marketing,common}` taxonomy this
  system's components will live in
- [product-model.md](product-model.md) — the `MusicProduct` fields the
  Product Card Anatomy section maps to
- [decisions.md](decisions.md) — why the underlying tech choices (Tailwind
  v4, shadcn/ui, Radix UI) were made
