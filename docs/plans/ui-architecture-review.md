# UI Architecture Review: Recreating Sample Select's UX on the TSS Design System

**Phase:** 4 — Sample Select UI Replication
**Status:** Analysis only. No implementation has started; this document exists to get the roadmap in §6 approved before any `feature/ui-*` branch opens.
**Subject:** [thesampleselect.com](https://thesampleselect.com) (reference UX) vs. the current TSS storefront (`feature/checkout` and earlier)
**Scope:** UX/layout/interaction replication only — no logos, imagery, trademarks, marketing copy, or brand-specific colors are copied. See `docs/design-system.md` and `docs/architecture.md` for the system this review builds on top of, not around.

---

## 1. Overall assessment

Structurally, TSS is closer to Sample Select than it looks. Both are a Listing → Detail → Cart → Checkout catalog with a two-column product detail page, a card-grid listing, and a regular/sale price treatment. TSS's architecture — DTO → mapper → domain → presentation component, Server Components by default, no GraphQL in the UI layer — needs none of that touched to close the visual gap. Every recommendation below is a restyle, an additive prop, or a new presentation component; none require a new service, mutation, or routing pattern.

What's different is *register*. TSS's own design system (`docs/design-system.md`) commits to "restrained," "quiet chrome," a monochrome interface with color used only for state. Sample Select is a working consumer storefront built to convert: a saturated hero banner, an amber CTA used everywhere, trust badges, testimonials, an FAQ, payment-method icons under every buy button. Closing this gap isn't a contradiction of the existing design system — it's finishing it. The system already *proposes* a warm amber accent (`oklch(0.7 0.15 75)`) sitting on a monochrome ground, "pending sign-off." Sample Select's actual CTA color validates that exact proposal. The work is turning proposed tokens into real ones and using them with the confidence a storefront needs, not inventing a new visual language.

The single largest structural gap is the homepage: it is currently `Hero` + `ShopByType` — one headline and a six-item text-link list, no product imagery, no live catalog data at all. Sample Select's homepage is roughly 80% product and bundle grids. Closing that gap needs one new section (a featured-products grid, wired to the existing `product.service.ts` — no new fetch pattern) and a heavier `Hero`, not a new page shape.

The one place this review recommends reopening a shipped decision: Sample Select's cart is not a page, it's a slide-over drawer triggered from a header icon with a live item-count badge. TSS's Cart phase explicitly deferred MiniCart "until a real need for them is shown" (`docs/decisions.md`, "Cart"). Replicating Sample Select's UX *is* that need — but it's a scope decision for the team to make explicitly, not something to fold silently into a restyle branch. See §2 (Cart) and §6.

**Reference pages walked live during this audit:** home, `/all-kits` (listing), a product detail page, and the cart drawer. Checkout was not reviewable — Sample Select hands off to a third-party hosted checkout domain, so there is no custom checkout UI of theirs to replicate (see §2, Checkout).

---

## 2. Page-by-page review

### Home

- **Similarities:** Section-based layout; a single H1 hero is already structurally present.
- **Differences:** Sample Select's hero is asymmetric — copy on the left, a large photographic image on the right, a colored/dark background, an eyebrow label ("OUT NOW!"), and a pill-shaped CTA. Below it: a two-column "Best Selling Bundles" tile grid (photographic background, dark gradient overlay, "Learn more" link), a full-bleed dark marketing block with a product-screenshot mockup, a "Best Selling Kits" product grid (play-button overlay per card), a giant faded wordmark divider, trust avatars, and a testimonial row. TSS's homepage today is `Hero` (centered text, no imagery, neutral-variant button) + `ShopByType` (a plain text-link grid to the six product types) — no live product data anywhere on the page.
- **Recommended changes:** Add a real featured-products section using the existing `ProductGrid` + `product.service.ts` (no new fetch pattern needed). Give `Hero` an image/media slot and an eyebrow label (already a documented Caption style in `design-system.md`) and route its CTA through the new accent color once implemented (§5). Restyle `ShopByType`'s cards to carry more visual weight, but keep it text/icon-based — the catalog has no category imagery to put behind these six links.

### Products (Listing)

- **Similarities:** `ProductGrid`'s column counts (1/2/3/4 by breakpoint) already roughly match Sample Select's 3-column kit grid.
- **Differences:** Sample Select's listing page has a centered title + subtitle + a large centered search bar, then the grid — no visible sort/filter toolbar; filtering happens via top-nav category links (Bundles, Crescent, ORIGINS, etc.) instead. Cards carry a circular play-button overlay for audio preview. TSS's `/products` has a left-aligned H1 beside a real toolbar (`ProductFilters`: sort, min/max price, on-sale checkbox) — functionally richer than the reference site's nav-only filtering, but styled with plain, native-feeling inputs. No audio preview exists anywhere.
- **Recommended changes:** Restyle `ProductFilters`' inputs/select to the evolving rounded/accent visual language — keep the toolbar itself; it's more capable than the reference site's, not a regression to remove in the name of visual parity. The one real interaction gap is the play-button preview (see §4).

### Product Detail

- **Similarities:** Already two columns (`ProductGallery` / `ProductInfo`); breadcrumbs present; the price treatment (strike-through regular price + emphasized sale price) structurally matches. The title is deliberately sized H4 per `design-system.md`'s documented exception, keeping artwork the focal point — correct as-is.
- **Differences:** Sample Select's left column has an inline play button and waveform scrubber directly on the artwork. Its right column adds a star-rating row above the title, expandable marketing copy ("Read more"), a large amber "Add to Cart" pill with a cart icon, and a payment-method icon row beneath it. Below the fold: additional preview tracks, trust-feature cards, an FAQ accordion. TSS's `ProductInfo`/`AddToCartButton` is plain — default button variant, no icon, no audio anywhere on the page.
- **Recommended changes:** This is the richest single gap on the site. Add an audio-preview affordance to the gallery once `previewUrl` is real (`MusicProduct.previewUrl` already exists in the domain model, unused — see §4). Promote `AddToCartButton` to the `lg` size + the new accent color + a cart icon — the existing Button hierarchy rule already permits this ("Add to Cart… at most one per view"); it only needs the accent color to exist. Trust cards, payment-method icons, and an FAQ are optional and content-dependent — don't fabricate copy, ratings, or badges the store doesn't actually back up (see §4, "Deliberately not recommended").

### Categories

- **Similarities:** Sample Select's closest equivalent is its top-nav category pages (Bundles, Crescent, Crescent Pro, …) — the same "category = filtered grid" concept TSS already implements.
- **Differences:** None worth separating out — `/categories/[slug]` composes Detail (the category term) + Listing (its products) from the exact same components as `/products`, per `docs/architecture.md`. There is no category-specific styling to review independently.
- **Recommended changes:** None category-specific. Every change to `ProductGrid`/`ProductCard`/`DetailNotFound` applies here automatically — a direct payoff of the existing composition decision, not new work.

### Search

- **Similarities:** `SearchForm` is a zero-JS GET form, functionally equivalent to Sample Select's search box (no client-side dependency either way).
- **Differences:** Sample Select's search bar is the visual centerpiece of its "All Kits" page — large, centered, rounded, icon-prefixed, with a live item count in the placeholder text. TSS's `SearchForm` is visually plain.
- **Recommended changes:** Restyle the input to a larger, rounded, icon-prefixed treatment. Cheap, high-fidelity win — no change to the underlying zero-JS form mechanism.

### Cart

- **Similarities:** `CartTable`'s row structure (thumbnail, title, price, quantity stepper with −/+, remove) is already functionally identical to Sample Select's drawer line items.
- **Differences:** Sample Select's cart is not a page — it's a slide-over drawer opened from a header cart icon with a live item-count badge: line items, a subtotal, and one full-width black "Checkout" button. TSS has a dedicated `/cart` page; `Header` links to it as plain text with no live count, per the Cart phase's explicit "No MiniCart… deferred until a real need for them is shown" decision.
- **Recommended changes:** Restyle `/cart` regardless (bigger imagery, accent-colored Checkout CTA, rounded container) — that's in scope for this initiative either way. A MiniCart drawer is the one recommendation in this entire document that reopens a previously closed architecture decision rather than restyling an already-open one. It should get its own branch and an explicit go/no-go from the team, not be folded into a generic cart restyle (see §6, §7).

### Checkout

- **Similarities:** Functionally analogous (address form, order summary, submit) — no meaningful visual reference exists to compare against.
- **Differences:** Sample Select hands off to a third-party hosted checkout domain, not their own custom UI — there is no "Sample Select checkout visual language" to replicate, because it isn't part of their own brand's design either. TSS's checkout is fully custom (built in Phase 1): billing/shipping form, order summary, validation, a redirect-based success state.
- **Recommended changes:** Stay inside TSS's own evolving design language (accent CTA, rounded inputs) rather than chasing an external payment processor's UI that doesn't belong to the reference brand anyway. Lowest priority page in this initiative.

### Success page

- **Similarities:** Not directly observable on the reference site — order confirmation happens on the hosted checkout processor, outside Sample Select's own UI.
- **Differences:** None to compare against. TSS's success page is a simple, custom confirmation view (order number, status, total, "Continue shopping").
- **Recommended changes:** Carry whatever card/rounded treatment the rest of the system adopts. No structural change needed.

---

## 3. Component review

Verdicts used below:

| Verdict | Meaning |
|---|---|
| **Keep** | Functions and looks right as-is |
| **Restyle** | Same structure and behavior, new visual treatment (CSS/tokens only) |
| **Refactor** | Needs new props or behavior, not just CSS |
| **Replace** | The current shape isn't right for the target UX |

| Component | Verdict | Why |
|---|---|---|
| Header | Restyle | Sticky/compact height logic already exists (`compact`/`sticky` props). Needs the new accent treatment and, if MiniCart is approved, a cart-icon-with-badge slot. |
| Navigation | Refactor | Structure and active-state rules are sound. The mobile drawer is a real, already-documented gap ("no mobile drawer yet" in the component's own comments) — needs building, not just restyling. |
| Hero | Refactor | Currently plain centered text with no imagery. Needs a real media slot, an eyebrow badge, and a background variant — new props, not new CSS alone. |
| ProductCard | Restyle now / refactor later | Spacing, radius, and price-row restyle is CSS-only. The audio play-button overlay needs new interactive state — contained to this component, but a real behavior change, not a restyle. |
| ProductGrid | Keep | Purely presentational already, and already responsive per its documented column-count rules. Inherits whatever ProductCard changes without needing its own work. |
| Filters (ProductFilters) | Restyle | Functional shape is already ahead of the reference site (real sort/price/on-sale filtering vs. nav-category-only). Visual-only change. |
| Breadcrumbs | Keep | Already matches the documented Caption-style, plain-`/`-separator pattern in `design-system.md`. No strong reference signal to chase — the reference site doesn't surface breadcrumbs prominently either. |
| Product Detail (ProductGallery / ProductInfo / ProductPricing / ProductMeta) | Restyle + targeted refactor | Spacing and button treatment restyle across the board; `ProductGallery` specifically needs the audio-preview affordance added (a refactor, scoped to that one component). |
| Cart (CartTable / CartSummary) | Restyle | Row structure already matches the reference drawer's line items closely. MiniCart is a new component, not a restyle of these two — see §2 (Cart). |
| Checkout (CheckoutForm / CheckoutOrderSummary) | Restyle | Visual only — inputs, buttons, spacing brought to the evolving design system. |
| Footer | Refactor | Currently store name + copyright + plain-text social links. The reference footer is multi-column, with icon socials and a CTA. Structural rework, but stays inside the existing `Footer`/`Container`/`storeConfig.social` primitives — extend, don't replace. |

---

## 4. New reusable components

Recommended only where they remove real, multi-consumer duplication — matching this project's own precedent (`docs/decisions.md`, "Two more real duplications, extracted rather than copy-pasted") of extracting on the second genuine repeat, not preemptively.

- **`AudioPreviewButton`** — the circular play/pause affordance. Composed by both `ProductCard` (grid) and `ProductGallery` (detail) — two real consumers from day one. This is the single highest-fidelity interaction match to the reference site, and the first real use of `MusicProduct.previewUrl`, which exists in the domain model today but is unused.
- **`MarketingFeatureCard`** — icon + heading + short description, for a homepage feature/trust row ("Instant Download", "Secure Payment"). Only build this if the store genuinely offers what a given card claims — reused 3–4× on one section, real duplication.
- **`PromoBanner`** — the dark, full-bleed marketing block pattern (image + eyebrow + headline + CTA). Reusable between the homepage and a future bundles landing page — one new component, two anticipated consumers.

**Deliberately not recommended:** a testimonial carousel, an FAQ accordion, and a star-rating display. All three need real data — reviews, ratings, FAQ content — that doesn't exist anywhere in the current domain model (`MusicProduct` has no rating/review field). Building any of these components ahead of the data means either fabricating placeholder content or shipping something permanently empty. This is the same discipline the project already applies to the `productType`/`producer` placeholders documented in `docs/product-model.md`: defer until the real field exists, don't invent it to fill a component.

---

## 5. Design system updates

Everything below evolves an existing, already-documented token in `docs/design-system.md` — nothing here is a new system.

### Color — promote the proposed accent from neutral to real

`design-system.md` already proposes a warm amber/gold accent (`oklch(0.7 0.15 75)` light / `oklch(0.78 0.15 75)` dark) sitting on an otherwise monochrome interface, explicitly marked "pending sign-off." Sample Select's actual CTA color validates that exact proposal rather than suggesting a different one. Recommend implementing it as-is in `app/globals.css`, along with the other proposed-but-unimplemented semantic colors:

| Token | Status | Notes |
|---|---|---|
| `--accent` (primary CTA) | Proposed → implement | Matches Sample Select's actual button color closely; a genuine validation of the existing proposal, not a new choice. |
| `--success` / `--success-foreground` | Proposed → implement | Needed once "Added to cart" states get visually louder. |
| `--warning` / `--warning-foreground` | Proposed → implement | Same status as above; no current consumer yet, but blocks nothing to add now. |
| `--destructive-foreground` | Missing → add | `--destructive` exists; its foreground pair doesn't, per the existing design-system.md gap note. |

Contrast must be verified (WCAG AA: 4.5:1 body text, 3:1 large text/UI) against both `--background` and `--card` before shipping, per the design system's own accessibility rule — this hasn't been possible until now, since the accent hasn't existed as a real token.

### Other token updates

| Token / area | Change |
|---|---|
| Radius | No new tokens needed — `radius-2xl` and `rounded-full` already exist in the system. The gap is application: Sample Select leans into pill-shaped CTAs and larger card radii. Nudge primary-CTA buttons toward a pill treatment; leave small controls (inputs, chips) at their current radii. |
| Shadow | Proposed in `design-system.md`, not yet implemented in `app/globals.css`. Implementing `shadow-md`/`shadow-lg` directly serves the card elevation Sample Select uses on hover and in its testimonial row. |
| `--font-sans` wiring | Pre-existing, already-documented defect: `app/globals.css`'s `@theme inline` block defines `--font-sans: var(--font-sans)` — a self-reference that never resolves to the loaded Geist Sans variable (`--font-mono` is wired correctly). Fix this in the first tokens branch; every typography restyle after it depends on Geist Sans actually rendering. |
| Icon sizing | No new tokens needed — the existing scale already covers the play-button and feature-icon sizes this initiative needs. |

---

## 6. Incremental implementation roadmap

Sequenced so the token work lands first — everything after depends on it — then outward from the pages with the largest gap. Each branch is scoped to stay small and independently reviewable.

1. **`feature/ui-tokens`** — Implement the real accent/success/warning/destructive-foreground colors, add shadow tokens, fix the `--font-sans` wiring defect. No component changes.
2. **`feature/ui-header-nav`** *(depends on: ui-tokens)* — Restyle Header/Navigation/Logo; build the mobile navigation drawer (existing, documented gap).
3. **`feature/ui-footer`** *(depends on: ui-tokens)* — Footer refactor: multi-column link groups, icon socials, a CTA. Split from header/nav since it's a bigger structural change and deserves its own review.
4. **`feature/ui-homepage`** *(depends on: ui-tokens)* — Hero refactor (media slot, eyebrow label, accent CTA) plus a new featured-products grid section using the existing `product.service.ts`.
5. **`feature/ui-product-grid`** *(depends on: ui-tokens)* — `ProductCard`/`ProductGrid` restyle only. `ProductFilters` was originally bundled into this item; architecture review split it out (below) — it's a separate UI concern (a form/toolbar, not the card/grid primitive this branch is scoped around) and doesn't need to land in the same branch as the card work to affect Products/Categories/Search, since all three already compose `ProductFilters` independently of `ProductCard`.
6. **`feature/ui-product-filters`** *(depends on: ui-tokens)* — `ProductFilters` restyle (sort/price/on-sale inputs → the evolving rounded/accent visual language). Affects Products, Categories, and Search simultaneously, since all three compose the same toolbar. No dependency on `feature/ui-product-grid` — can land before, after, or in parallel with it.
7. **`feature/ui-audio-preview`** *(depends on: ui-product-grid)* — Build `AudioPreviewButton`; wire into ProductCard and ProductGallery. Isolated on its own branch because it's the one genuinely new interactive component in this roadmap, not a restyle. No longer a prerequisite for item 8 below — see its note.
8. **`feature/ui-product-detail`** *(depends on: ui-tokens, ui-product-grid — **not** `ui-audio-preview`, corrected during this branch's own planning: verified it had no real dependency on audio preview, since every change it made is independent of it; audio preview still layers onto `ProductGallery`/`ProductInfo` later, whenever `feature/ui-audio-preview` ships, just not as a blocker)* — Completed: two-column breakpoint corrected to match this document's own §5 recommendation, `ProductGallery`'s secondary images given semantic list markup, `AddToCartButton` promoted to `lg` size (accent color needed no change — already automatic via `Button`'s `default` variant). An icon was evaluated and deliberately **not** added — no UX justification found independent of a reference site having one. Also the home for `ProductPricing`'s semantic-markup accessibility fix (missing `<del>`/`<s>`/`aria-label` distinguishing regular from sale price) — found during `feature/ui-product-grid`'s audit and deliberately deferred there, since `ProductPricing` is shared with, and this fix is non-visual/markup-only for, the Product Detail page this branch owns. Domain-data surfacing (`bpm`/`musicalKey`/`fileFormat`/`genres`) was evaluated and blocked: none of the four have a real WooCommerce/WPGraphQL schema source, confirmed against the GraphQL fragment and mapper directly — not implemented, no GraphQL/DTO/mapper expansion attempted. See `docs/decisions.md`, "Product Detail: breakpoint, gallery semantics, pricing accessibility."
9. **`feature/ui-cart`** *(depends on: ui-tokens)* — `/cart` page restyle only. MiniCart, if approved following this review, becomes its own follow-up branch (`feature/ui-minicart`) — a scope addition, not something folded into this one.
10. **`feature/ui-checkout`** *(depends on: ui-tokens)* — Checkout and success page restyle. Lowest priority — already the cleanest page relative to its own reference, which effectively doesn't have one.
11. **`feature/ui-polish`** *(depends on: everything above)* — Cross-page consistency pass: contrast-verify the new accent color, responsive QA on every new/changed component, `prefers-reduced-motion` check on the hover/scale treatments introduced above.

---

## 7. Risks

### Accessibility

- The new accent color is unverified against WCAG AA (4.5:1 body text, 3:1 large text/UI) on both `--background` and `--card` — it hasn't existed as a real, implemented token until this initiative.
- Audio-preview buttons need real `aria-label`s and must never be the only way to identify a track — title text stays primary, never icon-only.
- Touch-target sizing (44×44px minimum) is already flagged as unresolved for small/icon buttons in `design-system.md`. The new play-button component must meet this from the start, not be retrofitted after the fact.

### Responsiveness

- Sample Select's dense marketing sections (two-column bundle tiles, a three-column kit grid, a horizontal testimonial rail) need real mobile-first equivalents, not desktop layouts shrunk down — `design-system.md`'s "one column of truth per breakpoint" rule already covers this, but the new Hero/marketing components need to be designed mobile-first from the start.
- A horizontal-scroll section, if built, needs a genuine touch-scroll/swipe pattern, not just clipped overflow.

### Performance

- Audio preview is a real new cost: dozens of products on a single grid page means players must instantiate on interaction, never eagerly on page load.
- Large hero/marketing imagery must go through the existing `next/image` + `ProductImage` pattern with real `sizes`, not a raw `<img>`.
- The homepage's new featured-products section is a new data dependency — it should reuse `getProductsPage`'s existing fetch/caching behavior rather than introducing a one-off fetch.

### Maintainability

- Resist copying Sample Select's literal pixel values. Every restyle should route through the existing spacing/radius token tables in `design-system.md`, or the system drifts back into the per-component improvisation the design philosophy explicitly warns against.
- MiniCart is the one recommendation in this document that reopens a closed architecture decision rather than restyling an already-open one. Bundling it into a routine cart restyle branch would slip a scope change past review — it needs its own explicit approval, per §2 (Cart) and §6.

---

## Methodology

This review is based on a direct read of the current TSS codebase — `Header`, `Navigation`, `Hero`, `ShopByType`, `ProductCard`, `ProductGrid`, `ProductFilters`, `Breadcrumbs`, `ProductGallery`, `ProductInfo`, `ProductPricing`, `ProductImage`, `CartTable`, `CartSummary`, `CheckoutForm`, `CheckoutOrderSummary`, `Footer`, `Logo`, `Container`, plus `docs/design-system.md` and `docs/component-principles.md` — and a live walkthrough of thesampleselect.com (home, `/all-kits`, a product detail page, and the cart drawer; checkout was not reachable as a custom UI, since it hands off to a third-party hosted processor). No code was changed as part of this review.
