# Implementation Plan: `feature/ui-product-grid`

**Governing document:** `docs/plans/ui-architecture-review.md`, §6 item 5; builds on the real, verified tokens shipped in `feature/ui-tokens` (`docs/design-system.md`, `docs/decisions.md`)
**Status:** Approved by architecture review, with two corrections incorporated below (shadow token naming; `ProductFilters` scope). Implementation in progress. Not yet committed.

---

## Branch objective

Modernize the product listing presentation — `ProductCard` as the primary design primitive, `ProductGrid` staying purely layout — while preserving `getProductsPage() → ProductGrid → ProductCard` exactly as-is. Concretely: fill in the one deliberately-deferred piece of `ProductCard`'s own spec (sale badges), add a card-level hover treatment consistent with the new shadow tokens, and confirm everything else already matches `docs/design-system.md`'s Product Card Anatomy section rather than assuming it needs work.

**Headline finding from this audit: most of the evaluation list is already spec-compliant.** Checked line-by-line against `design-system.md`'s Product Card Anatomy table — title sizing, producer/type styling, artwork ratio and hover-scale, internal spacing, and the grid's responsive column counts all already match the documented values exactly. The real gap is narrower than the branch's "Evaluate" list implies: sale badges (explicitly documented as deferred), and a card-level hover state (currently only the artwork scales; the card itself has no elevation change). Everything else below is either "confirmed compliant, no change" or one of those two real gaps.

---

## Files expected to change

| File | Change |
|---|---|
| `components/commerce/ProductCard/ProductCard.tsx` | Add the sale badge (composed from the existing `Badge` primitive, derived from data already in `ProductCardProps` — no new prop). Add resting/hover shadow classes to the `Card` usage. |
| `components/commerce/ProductCard/ProductCardSkeleton.tsx` | Match the same resting shadow so the loading → loaded transition doesn't include a visible elevation "pop." |
| `docs/design-system.md` | Record the two real decisions this branch makes (badge placement, the resting-elevation tier's arbitrary-value usage) in the Product Card Anatomy section, which currently documents both as open. |
| `docs/decisions.md` | New ADR entry — decision only, no token values duplicated (same discipline as `feature/ui-tokens`). |

**Not expected to change:** `app/globals.css`. See "Use of the new semantic design tokens" below for why the hover-elevation work doesn't need it.

No `.ts` mapper, service, GraphQL, DTO, domain model, or route file is expected to change. `product-card.mapper.ts` specifically — see "A deliberately excluded case" below for why, even though it's the one file in this component's folder that could plausibly need a line added.

---

## UI improvements to implement

### 1. Sale badge (the real, confirmed gap)

`design-system.md`'s Product Card Anatomy table has always specified a Badges row (`featured`, `salePrice !== null`) using the existing `Badge` component — `ProductCard.tsx`'s own doc comment already says this is "unused for now since nothing in this pass needed `featured`/sale flags." This branch is that pass, for the sale case specifically.

- **No mapper or props change needed.** `ProductCardProps.price.salePrice` is already non-null exactly when a product is on sale — the badge's visibility condition is data already flowing through the component, not a new field.
- **Placement: artwork corner overlay**, not inline above the title. `design-system.md` explicitly leaves this an open choice ("pick one placement and use it everywhere, don't mix") — recommending the corner overlay because it keeps the badge read as part of the artwork (consistent with "artwork-first") rather than adding a new chrome row to the text block, and it's the placement the reference site (`docs/plans/ui-architecture-review.md`'s "NEW" badge) uses. This is a real design decision, not a default — flagged explicitly for approval.
- **Implementation shape:** wrap the existing `ProductImage` usage in a `relative` container *local to `ProductCard.tsx`* and position the badge as an absolutely-positioned sibling, rather than adding a `badge` prop to `ProductImage` itself. `ProductImage` is shared with `ProductGallery` on the product detail page (explicitly out of scope) — this keeps `ProductImage.tsx` completely untouched rather than growing its public API for a grid-only concern.
- **Label:** "Sale" (or the store's existing copy convention — check `data/`/`lib/config/store.ts` for any established term before hardcoding one; this project's voice guidance in `design-system.md` — "never exclamation-mark marketing copy" — rules out anything like "SALE!!!").

### 2. Card-level hover elevation

Currently `ProductCard` only animates the artwork (`group-hover:scale-[1.03]`, already matching `design-system.md`'s documented hover behavior exactly) — the card itself has no elevation change. Sample Select's kit cards read as more "liftable." Recommend a resting `shadow` at rest and a stronger one on hover, using the shadow tokens `feature/ui-tokens` already implemented and verified.

### 3. Everything else: confirmed compliant, not touched

Checked explicitly so "evaluate X" isn't quietly skipped:

- **Product imagery** — `ProductImage` already does 1:1 ratio, `object-cover`, a quiet `--muted` placeholder (never a fake image), and the documented hover-scale. No gap.
- **Typography hierarchy** — title is `text-[1.25rem] leading-[1.3] font-medium` = exactly H4 (1.25rem/500/1.3) per the Typography table, which explicitly assigns H4 to "product title in a detail view" *and* the card. Producer (`text-sm text-muted-foreground`) = Body Small/Text Secondary, exactly as specified. Product type (`text-xs font-medium text-muted-foreground`) = Caption, exactly as specified. No gap.
- **Pricing presentation** — see the explicit call-out below; this one has a real finding, but the finding is "don't make the change that seemed obvious," not a UI change.
- **Spacing** — card padding, artwork-to-metadata gap, stacked-metadata-line gap, and gap-before-price all already match the Spacing Scale values `design-system.md` documents for each (md/2xs/sm respectively, verified against the actual Tailwind classes in the current component). No gap.
- **Responsive behavior** — `ProductGrid`'s `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` already lines up with this project's own custom-defined tier boundaries in the Responsive Strategy section (not naive Tailwind defaults) — 3 columns at the "Desktop" tier, 4 at "Large desktop," matching exactly. No gap.

### A finding that changes a recommendation: sale price should *not* be recolored to the accent

The obvious-seeming move — recolor `ProductPricing`'s emphasized sale price from `text-foreground` to `text-primary`, since `design-system.md` lists "(Text Primary **or Accent**)" for sale price — was checked against the real, verified contrast data from `feature/ui-tokens` before including it here, not assumed safe by extension. It isn't: `--primary` was verified there as safe *as a filled background with `--primary-foreground` text on top* (that pairing passes WCAG AA in both themes), but **`--primary` used as bare text directly on `--background`/`--card` measures 2.73:1 in light theme — below even the 3:1 large-text floor, let alone 4.5:1 for body-sized text.** That specific pairing was never verified as passing, because it was never the pairing `feature/ui-tokens` implemented anything for.

**Recommendation: leave `ProductPricing.tsx` untouched.** The "use the new accent token" objective for this branch is fully satisfied by the sale badge (`Badge`'s `default` variant, which is exactly the `--primary`/`--primary-foreground` pairing that *is* verified) — there's no need to also recolor price text, and doing so would introduce an unverified, likely-failing pairing. `docs/plans/ui-tokens-plan.md` flagged this exact swap as a "borderline case... let the product-grid branch decide" — this is that decision, and the decision is no.

---

## Existing components to reuse

- **`Badge`** (`components/ui/badge.tsx`) — its `default` variant (`bg-primary text-primary-foreground`) is composed as-is for the sale badge. No new variant needed.
- **`ProductImage`** — used exactly as today; only wrapped in an additional local container in `ProductCard.tsx`, never modified itself.
- **`ProductGrid`**, **`product-grid-layout.ts`**, **`ProductGridSkeleton`** — no change. `ProductGrid` stays purely a layout container, as instructed; nothing in this plan asks it to know about badges, shadows, or anything else `ProductCard`-specific.
- **`Card`/`CardContent`** (`components/ui/card.tsx`) — reused as today. The new shadow classes are added at the `ProductCard.tsx` usage site (a `className` addition to the existing `<Card>` element), not by editing the shared `ui/card.tsx` primitive — `Card` has exactly one real consumer (`ProductCard`/`ProductCardSkeleton`, confirmed via a repo-wide search), but keeping product-specific hover behavior out of the generic primitive matches `component-principles.md`'s "`components/ui/` primitives must work with any data" rule for the future consumer that isn't `ProductCard`.

## Components that should remain unchanged

Per the branch's explicit out-of-scope list and this audit's findings — `ProductGallery`, `ProductInfo`, `ProductPricing`, `ProductMeta` (all Product Detail), `Hero`, `Header`, `Navigation`, `Footer`, `CartTable`/`CartSummary`, `CheckoutForm`/`CheckoutOrderSummary`, every page (`app/**/page.tsx`), and `AddToCartButton`. `ProductImage` is reused but not modified (see above).

**`ProductFilters` — confirmed out of scope.** `docs/plans/ui-architecture-review.md`'s original roadmap (§6, item 5) had bundled a `ProductFilters` restyle into this same branch. Architecture review confirmed `ProductFilters` is a separate UI concern and should stay out of `feature/ui-product-grid` — the roadmap has been corrected: §6 now lists it as its own item, `feature/ui-product-filters`, depending only on `feature/ui-tokens` (not on this branch), so the roadmap and this scope decision stay consistent rather than drifting apart.

**`product-card.mapper.ts` — deliberately excluded.** A `featured` badge is equally supported by `design-system.md`'s spec, but `MusicProduct.featured` isn't currently mapped into `ProductCardProps` at all — adding it would need a real (if small) change to this mapper. The task's own scope list says "Sale badges," not "Featured badges," and the sale badge needs zero mapper change (see above) — so this branch implements only what's asked, and featured-badge support stays a flagged future option rather than something quietly added because it was adjacent.

---

## Accessibility considerations

- **The sale badge should be `aria-hidden`, not independently announced.** `ProductPricing` already communicates "this is on sale" accessibly via the visible regular/sale price pair — a screen reader announcing "Sale" *and* both prices for the same card is redundant, not additive. The badge is a visual reinforcement of information already present in the accessible text, not a second source of it.
- **A real, pre-existing gap found during this audit, resolved as an out-of-branch follow-up, not fixed here.** `ProductPricing`'s regular-price element is a plain `<span>` with a CSS strikethrough (`line-through`) — not a semantic `<del>`/`<s>` element and no `aria-label`/visually-hidden text distinguishing "was" from "now." A screen reader announces both numbers with no indication which is the discounted price. This is a real WCAG concern independent of anything else in this plan, but `ProductPricing.tsx` is explicitly out of scope for `feature/ui-product-grid` and shared with the Product Detail page. Architecture review's decision: leave `ProductPricing.tsx` untouched in this branch; the fix is recorded as a follow-up for `feature/ui-product-detail` (`docs/plans/ui-architecture-review.md`, §6, item 8) — a narrowly-scoped, non-visual markup correction (semantic elements/`sr-only` labels only, no class or layout change) to make there, not here.
- **Touch target sizing is unaffected.** The badge is non-interactive (no click handler, no focus stop) and doesn't sit inside the card's existing single large tap target (the whole card is one `<Link>`) — it can't shrink or fragment that target.
- **New shadow classes carry no contrast concern** — they're an elevation cue, not text or a UI-component boundary color, so the WCAG contrast rules `feature/ui-tokens` verified against don't apply here. `prefers-reduced-motion` is already handled at the framework/Tailwind level for the existing artwork-scale transition; the new shadow transition (if animated on hover) should respect the same preference — verify during implementation, not assumed.

---

## Responsive behavior

No column, gutter, or breakpoint change — confirmed above as already compliant. The sale badge and hover shadow both need to degrade sensibly on touch devices, where "hover" isn't a real interaction state:

- The badge is always visible when a product is on sale (not hover-gated), so it needs no touch equivalent — it's not a hover-reveal affordance.
- The hover shadow is a progressive-enhancement detail, not information — a touch device simply not showing the elevated state on tap is an acceptable, expected outcome (per `design-system.md`'s Motion Principles: "Every hover effect needs a touch-device equivalent" applies to hover states that convey *information*; a lift-on-hover elevation cue with no informational content is the same category as the existing artwork-scale hover, which this project has already accepted has no separate touch equivalent).

---

## Verification plan

Same shape as `feature/ui-tokens`, adjusted for this branch's actual surface:

1. `npx tsc --noEmit` and `npm run lint` — both components change (`ProductCard.tsx`, `ProductCardSkeleton.tsx`), so unlike the tokens branch these aren't a no-op safety net this time.
2. `npm run build` — confirms nothing in the new markup breaks static generation for `/products`, `/categories/[slug]`, `/search` (all three render through `ProductGrid`/`ProductCard`).
3. **Manual visual pass**, both themes, using a temporary product with a sale price (`wp wc product create --regular_price=... --sale_price=...`, same discipline as every prior branch — created, verified, deleted, store re-confirmed at zero afterward):
   - Confirm the badge renders, is legible, and doesn't visually collide with the play/quick-add affordances that don't exist yet but shouldn't be assumed absent forever — check it doesn't overlap anything else on the card at any grid column width.
   - Confirm the badge does **not** appear on a non-sale product.
   - Confirm the resting/hover shadow renders correctly in both themes (dark-mode shadows are intentionally faint per `design-system.md` — confirm "intentionally subtle" and "not rendering at all" are visibly different, not the same thing by accident).
   - Confirm `ProductCardSkeleton`'s resting shadow matches the loaded card's, so `/products/loading.tsx` doesn't visibly "pop" on content arrival.
4. Confirm via `git diff --name-only` that `services/`, `graphql/`, `types/`, `lib/apollo/`, and every `app/**/page.tsx` route are untouched — same explicit check as the tokens branch, appropriate here too since "no architecture changes" is a standing constraint on every branch in this initiative, not just the foundation one.

---

## Documentation updates required after implementation

- **`docs/design-system.md`, Product Card Anatomy:** record the corner-overlay placement decision for the Badges row (currently documents both options as open — this branch closes that question) and note the resting/hover shadow addition.
- **`docs/decisions.md`:** a new ADR entry — the badge-placement decision, the "why `ProductPricing` was deliberately not touched" finding (this is the one worth recording most: it's a real, non-obvious correction that a future branch could otherwise re-attempt), and the shadow-token usage approach (arbitrary-value syntax, no `globals.css` change, see below). Decision only, no token values restated, consistent with `feature/ui-tokens`' established discipline.

---

## Risks or architectural considerations

- **Use of the new semantic design tokens — resolved without touching `app/globals.css`, and verified against the actual variable names, not the Shadow System table's shorthand labels.** `app/globals.css` was re-read directly before finalizing this, not assumed from `design-system.md`'s table. Two different things share similar-looking names and shouldn't be conflated: `design-system.md`'s Shadow System table labels its rows `shadow-sm`/`shadow-md`/`shadow-lg`/`shadow-xl` as documentation shorthand for each elevation tier — those labels are not themselves CSS variables. The actual CSS custom properties in `app/globals.css` are named `--elevation-sm`/`--elevation-md`/`--elevation-lg`/`--elevation-xl` (both themes). Only one of the four has a registered Tailwind utility: `@theme inline` maps `--shadow-lg: var(--elevation-lg)`, which is what makes a plain `shadow-lg`/`hover:shadow-lg` class work today — `SkipToContent` is its existing consumer, and using it here gives it a second real one. **There is no `--shadow-md` variable anywhere in the file, registered or not** — the resting elevation tier's only real CSS variable is `--elevation-md`. Recommend referencing it directly via this project's own established CSS-variable-shorthand syntax — `shadow-(--elevation-md)`, matching the existing `py-(--card-spacing)`/`px-(--container-padding-mobile)` precedent already in the codebase — rather than registering a new `--shadow-md` Tailwind utility in `@theme inline` for what would still be a single consumer. This keeps the branch's entire footprint inside `components/` and `docs/`, with no token-infrastructure file touched, and correctly references the token that actually exists rather than one that doesn't. If a later branch also wants resting elevation somewhere else, *that's* the second real use that justifies registering `--elevation-md` as a proper `shadow-md` Tailwind utility, the same way `--elevation-lg` was promoted to `shadow-lg`.
- **The `ProductFilters` scope discrepancy — resolved.** Architecture review confirmed it stays out of this branch; `docs/plans/ui-architecture-review.md`'s roadmap now lists it as its own item (`feature/ui-product-filters`), so the roadmap and this branch's scope no longer disagree.
- **The `ProductPricing` semantic-markup accessibility finding — resolved.** Real, but adjacent: recorded as a follow-up for `feature/ui-product-detail` (see Accessibility Considerations and the roadmap), not fixed in this branch and not silently dropped.
- **Maintainability:** both new pieces of UI (badge, shadow) route through already-verified, already-existing tokens and primitives — this branch introduces no new color, no new spacing value, and no new component. That's the intended outcome of a "primitive-first" token foundation actually paying off, not a coincidence worth losing track of in review.
