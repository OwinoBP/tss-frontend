# Implementation Plan: `feature/ui-product-detail`

**Governing document:** `docs/plans/ui-architecture-review.md`, §2 "Product Detail" and §6 item 8; builds on `feature/ui-tokens` and `feature/ui-product-grid`, both inherited on this branch (verified: `feature/ui-product-grid` is an ancestor of `feature/ui-product-detail`, tips identical).
**Status:** Planning only. No code has been written or committed for this branch. Waiting for architecture review approval before implementation begins.

---

## 1. Branch objective

Modernize the Product Detail presentation — `ProductGallery`, `ProductInfo`, `ProductPricing`, `ProductMeta`, `AddToCartButton`, as composed by `app/products/[slug]/page.tsx` — while preserving the Detail Pattern exactly: same DTO → Mapper → `MusicProduct` → Presentation Mapper → component pipeline, same `loading.tsx`/`error.tsx`/`DetailNotFound`/`DETAIL_NOT_FOUND_METADATA` mitigation for the confirmed Next.js `notFound()` defect, no GraphQL/service/DTO/domain-model/routing change.

**This plan is audit-driven, not Sample-Select-driven.** Every proposed change below is justified against either (a) a place the current code doesn't match `docs/design-system.md`'s own already-written rules, or (b) real `MusicProduct` domain data that exists today but isn't presented anywhere. Nothing is proposed because "Sample Select does it that way" — where the architecture review's Sample Select comparison suggested something with no TSS-side grounding (trust cards, payment-method icons, star ratings, an FAQ, "Read more" truncation), it's addressed in §15 as deliberately excluded, not included here.

---

## 2. Current Product Detail implementation audit

Read directly, not assumed from `docs/design-system.md` or `docs/plans/ui-architecture-review.md` — three concrete mismatches turned up between what's documented and what's actually in the code (§4, items 1 and the two stale doc lines under item 6).

### Page (`app/products/[slug]/page.tsx`)
Two-column grid (`ProductGallery` / `ProductInfo` + `AddToCartButton`), `Breadcrumbs` above it, `DetailNotFound` inline conditional on `!product`, `generateMetadata` with the `DETAIL_NOT_FOUND_METADATA` fallback — exactly the Detail Pattern. Grid switches to two columns at `lg:` (1024px).

### `ProductGallery`
1:1 primary image via `ProductImage` (`priority`, matches the Image Ratio rule), secondary images in a **bare `<div className="grid grid-cols-4 gap-2">`** — not a semantic list. No click-to-swap/lightbox — a standing, deliberate deferral (`docs/decisions.md`: no real multi-image product exists yet to validate that UX against). Still true today; not revisited.

### `ProductInfo`
Title: semantic `<h1>`, sized `text-[1.25rem] leading-[1.3] font-medium` — exactly H4, matching `design-system.md`'s documented typographic exception and identical to `ProductCard`'s own title sizing. Description: rendered as trusted WooCommerce HTML via `dangerouslySetInnerHTML`, Body-size (`text-sm leading-relaxed`), restrained list/paragraph spacing (`[&_p]:mb-4`, etc.) — no overflow or "wall of text" problem observed in the fixture data to justify a "Read more" affordance.

### `ProductPricing`
`size="lg"` variant used here (vs. `ProductCard`'s `size="sm"`). Regular price: a plain `<span className="... line-through">` — **not** `<del>`/`<s>`, no `aria-label`/`sr-only` text distinguishing "was" from "now." Sale price: `text-2xl text-foreground` — confirmed **not** `text-primary` (the color `feature/ui-product-grid` verified fails WCAG AA as bare text and explicitly rejected).

### `ProductMeta`
Already semantic (`<dl>/<dt>/<dd>`), already reuses `Badge` (`outline` for linked categories, `secondary` for tags) — no new pattern needed here structurally. Surfaces `producer`, `productType`, `categories`, `tags` only. **`MusicProduct.bpm`, `.musicalKey`, `.fileFormat`, `.genres` are never mapped into `ProductInfoProps`/`ProductMetaProps` at all** — real domain data, invisible on the one page whose entire purpose is full product detail.

### `AddToCartButton`
Single real consumer confirmed via repo-wide search: `app/products/[slug]/page.tsx` only (a doc-comment reference in `CheckoutForm.tsx` is not a usage). Renders `<Button type="submit">` — **no `size` prop**, so it defaults to `size="default"` (`h-8`/32px), no icon. Because `Button`'s `default` *variant* already resolves to `bg-primary text-primary-foreground` (untouched by this component, unrelated to the `size` gap), **it already renders in the new accent color automatically** — that part of the architecture review's recommendation needs zero code change.

### Breadcrumbs, `DetailNotFound`, `loading.tsx`, `error.tsx`
All already match their documented spec (Caption style, plain `/` separator; generic, presentation-only, `outline`-variant recovery button; skeleton mirrors the real page's shape; client error boundary with `console.error` + retry). No Product-Detail-specific gap found in any of the four.

---

## 3. Existing patterns being preserved

- DTO → Mapper → `MusicProduct` → Presentation Mapper → component pipeline (`product-gallery.mapper.ts`, `product-info.mapper.ts`) — untouched in shape; one mapper gets additive fields only (§4, item 4).
- Detail Pattern's error-handling mitigation: `loading.tsx` (Suspense), `error.tsx` (thrown errors), inline `DetailNotFound` conditional, `DETAIL_NOT_FOUND_METADATA` — no `notFound()`/`not-found.tsx` introduced, matching the confirmed Next.js 16 defect this avoids.
- `Button`/`Badge`/`Card` primitives, `ProductImage`, `ProductPricing` — reused as-is or extended in place, no parallel component system created.
- The `data-icon="inline-start"`/`inline-end` icon-in-button pattern already established in `app/search/page.tsx`, `app/products/page.tsx`, `app/categories/[slug]/page.tsx` (all `ArrowRight` + `data-icon="inline-end"`) — reused for `AddToCartButton`'s new icon rather than inventing a new icon-composition approach.
- `ProductGrid`'s existing `<ul>/<li>` convention for a repeated collection of items — reused for `ProductGallery`'s secondary images rather than leaving them as unstructured `<div>`s.

---

## 4. Exact UI gaps identified

Each gap below is either a verified mismatch against `design-system.md`'s own text or real, unsurfaced domain data — not a Sample Select import.

### 1. Two-column breakpoint doesn't match the documented tier (Required)

`docs/design-system.md`'s Responsive Strategy table states the **Tablet** tier (768–1024px) is where "two-column grids become viable," and its own Product Detail Anatomy row claims — in the present tense, as already-implemented fact — "Two columns at desktop/tablet (gallery, info), one column mobile." The actual code switches at `lg:` (1024px), so a genuine tablet-width viewport (768–1023px) renders single-column today. This is a documentation/implementation mismatch caught by reading the code directly, exactly the kind of thing this plan was asked to check for rather than assume. **Fix:** change the grid's `lg:grid-cols-2` to `md:grid-cols-2` in `app/products/[slug]/page.tsx`, bringing the code in line with what the design system already (currently incorrectly) claims is true.

### 2. `ProductGallery` secondary images aren't a semantic list (Required, no visual change)

A repeated collection of items rendered as a bare `<div className="grid grid-cols-4 gap-2">` of `<ProductImage>`s, inconsistent with this project's own established convention for exactly this situation (`ProductGrid` uses `<ul>/<li>` for its repeated `ProductCard`s). **Fix:** wrap in `<ul>/<li>`, identical visual output (no new classes on the list itself beyond what already exists on the grid div).

### 3. `AddToCartButton`: size and icon (Required)

`design-system.md`'s own Button hierarchy section reserves `lg` "for a page's single most important CTA" — this is that button, on this page, and nowhere else (confirmed single consumer). The architecture review (§2, already-approved) recommends exactly this: `lg` size + icon. Accent color needs no change (already automatic, see audit above). **Fix:** add `size="lg"` and a `ShoppingCart` icon (`aria-hidden`, `data-icon="inline-start"`, matching the existing `ArrowRight`/`data-icon="inline-end"` precedent) to the `<Button>` inside `AddToCartButton.tsx`. Not exposed as a new prop — one real consumer, no abstraction needed (extract-on-second-use).

### 4. Real domain data never surfaces on Product Detail (Flagged — needs explicit sign-off, not assumed)

`MusicProduct.bpm`, `.musicalKey`, `.fileFormat`, and `.genres` all exist in the canonical domain model today and are never mapped into anything `ProductInfo`/`ProductMeta` renders. This is the one change in this plan that touches a presentation mapper (`product-info.mapper.ts`) — explicitly permitted by this branch's own scope rules ("mappers unless the audit proves a presentation requirement genuinely cannot be satisfied without one"; BPM/key/format literally cannot be presented without adding them to the mapper's output), but flagged here rather than silently included, per the same rule's instruction to stop and flag rather than quietly expand the branch.

- **Why this belongs to Product Detail, not elsewhere:** this is exactly the "richer view... more room to show it" page `design-system.md` already describes Product Detail as being, relative to `ProductCard`. `ProductCard` intentionally doesn't carry this — no change proposed there.
- **Why it's presentation, not architecture:** `MusicProduct` already has these fields (populated since the original product-query branch); no GraphQL, DTO, service, or domain-model change is needed — only `product-info.mapper.ts` (a presentation mapper, downstream of `MusicProduct` per this branch's own governing pipeline diagram) plus additive `ProductMeta` props/rendering.
- **Recommendation:** include it. It's low-risk (additive fields, `null`/empty-array-safe, no removal or restructuring of existing fields) and directly answers this plan's own guiding question — "what does the existing TSS Product Detail need to become a better version of itself" — with real, already-collected catalog data, not a speculative addition.
- **If declined:** no other change in this plan depends on it; everything else stands alone.

### 5. `ProductPricing`'s missing semantic markup — see §8 (dedicated section, per this branch's task)

### 6. Two stale documentation lines contradicting `feature/ui-product-grid`'s own finding (Required for one, flagged for the other)

`design-system.md` still contains two lines describing sale-price text as viable in "Text Primary **or Accent**," despite `feature/ui-product-grid`'s own ADR (`docs/decisions.md`, "Product card: sale badge and hover elevation") already finding `--primary` fails WCAG AA as bare text and rejecting exactly that pairing:
- Colour System's **Accent** row purpose text (line 176: "...the sale-price emphasis...").
- Product Card Anatomy's **Pricing** row (line 485: "sale price emphasized (Text Primary or Accent)").

The first line is general system documentation (fair game for any branch touching the Accent role's description) and is corrected as part of this branch's own `ProductPricing` decision write-up (§8) — same fact, directly tied to what this branch is deciding either way. The second line technically sits inside **Product Card Anatomy**, not Product Detail Anatomy — `feature/ui-product-grid`'s territory, not this branch's. Flagged explicitly rather than silently touched: recommend fixing it here anyway (it's the same one-fact, two-word correction — removing "or Accent" — and a separate branch for that is disproportionate process), but this is a reviewer call, not an assumed yes.

### 7. Roadmap dependency doesn't match reality (Flagged, not silently worked around)

`docs/plans/ui-architecture-review.md` §6 currently lists `feature/ui-product-detail` (item 8) as depending on `feature/ui-audio-preview` (item 7) — but Audio Preview is explicitly out of scope for this branch and hasn't been built yet. This plan proceeds without it (every gap above is independent of audio preview), which means the roadmap's stated dependency no longer matches how this branch is actually being sequenced. **Recommendation:** loosen `feature/ui-product-detail`'s roadmap entry to depend only on `ui-tokens`/`ui-product-grid`, and note that the audio-preview affordance layers onto `ProductGallery`/`ProductInfo` later, on its own already-planned branch, once `feature/ui-audio-preview` ships — not a reason to block everything else in this plan. A planning-doc correction, for reviewer sign-off, same as the `ProductFilters` split was in the previous branch.

### Confirmed compliant — audited, not changed

- Title hierarchy/sizing (H4, matches documented exception).
- Description rendering, sizing, and spacing (no overflow problem observed; no "Read more" affordance added — see §15).
- `ProductMeta`'s existing structure (`<dl>`, `Badge` reuse) — already correct pattern, only gaining new rows if item 4 is approved.
- Gallery's lack of lightbox/click-to-swap — still no real multi-image data to validate that UX against; deferral stands.
- Breadcrumbs, `DetailNotFound`, `loading.tsx`'s shape, `error.tsx` — no gap found.
- Focus-visible ring coverage on every existing interactive element (`Breadcrumbs` links, `Button`, `Badge`-as-link) — already consistent, project-wide pattern.

---

## 5. Exact files expected to change

| File | Change | Why it belongs here |
|---|---|---|
| `app/products/[slug]/page.tsx` | `lg:grid-cols-2` → `md:grid-cols-2` | §4 item 1 — matches `design-system.md`'s own documented tier |
| `app/products/[slug]/loading.tsx` | Same breakpoint change on its mirrored grid | Preserves the file's own stated invariant ("same grid shape as the real page so nothing visibly jumps") — not a redesign of the Detail Pattern mitigation itself, which stays exactly in place |
| `components/commerce/ProductGallery/ProductGallery.tsx` | Secondary images: `<div>` → `<ul>/<li>` | §4 item 2 — no visual change |
| `components/commerce/AddToCartButton/AddToCartButton.tsx` | `size="lg"`, `ShoppingCart` icon | §4 item 3 |
| `components/commerce/ProductPricing/ProductPricing.tsx` | Semantic `<del>` + `sr-only` labels | §8 |
| `components/commerce/ProductMeta/ProductMeta.tsx`, `ProductMeta.types.ts` | Additive BPM/Key/Format rows | §4 item 4 — **only if approved** |
| `components/commerce/ProductInfo/product-info.mapper.ts` | Map `bpm`/`musicalKey`/`fileFormat`/`genres` | §4 item 4 — **only if approved**; the one mapper touch in this plan |
| `components/commerce/ProductInfo/ProductInfoSkeleton.tsx` | Add matching skeleton rows for the new meta fields | Only needed if item 4 is approved — keeps the skeleton's shape in sync with `ProductMeta`'s loaded shape, same discipline as every other skeleton in this codebase |
| `docs/design-system.md` | Product Detail Anatomy updates (breakpoint, `AddToCartButton` size/icon, new meta rows if approved); the two stale "Text Primary or Accent" lines (§4 item 6) | Document what actually ships |
| `docs/decisions.md` | New ADR entry — decision only, no token values restated | Same discipline as `feature/ui-tokens`/`feature/ui-product-grid` |
| `docs/plans/ui-architecture-review.md` | Loosen `feature/ui-product-detail`'s roadmap dependency (§4 item 7) | **Only if reviewer agrees** — flagged, not assumed |

**Not expected to change:** `app/globals.css` (no new/different token values needed — see §9), `ProductGallerySkeleton.tsx` (self-contained, doesn't reference the page-level breakpoint), `Breadcrumbs.tsx`, `DetailNotFound.tsx`, `detail-not-found-metadata.ts`, `error.tsx`, `Button`/`Badge`/`Card`/`ProductImage` primitives (consumed as-is), `product-gallery.mapper.ts` (no new fields needed there).

No GraphQL, service, DTO, or domain-model file is expected to change. No routing change. No Apollo change.

---

## 6. Components expected to change

`ProductGallery`, `AddToCartButton`, `ProductPricing` (shared with `ProductCard` — see §8's explicit note on that), and — only if §4 item 4 is approved — `ProductMeta` and `ProductInfoSkeleton`.

## 7. Components explicitly remaining unchanged

`ProductInfo.tsx` itself (title/description/composition logic stays as-is; it only re-renders whatever `ProductPricing`/`ProductMeta` now produce), `Breadcrumbs`, `DetailNotFound`, `DETAIL_NOT_FOUND_METADATA`, `error.tsx`, `ProductImage`, `Button`/`Badge`/`Card` primitives, `product-gallery.mapper.ts`, `ProductGallerySkeleton`. Also, per explicit branch scope: `ProductGrid`, `ProductCard` (redesign), `ProductFilters`, `Header`, `Footer`, `Homepage`, Audio Preview, cart architecture, checkout — none of these are touched.

---

## 8. `ProductPricing` / accessibility decision

**This finding belongs in `feature/ui-product-detail`. Decision: yes, include it.**

Recap of the deferred finding (`feature/ui-product-grid`, `docs/decisions.md`): `ProductPricing`'s regular-price element is a plain `<span>` with a CSS `line-through` — not a semantic `<del>`/`<s>` element, no `aria-label`/`sr-only` text distinguishing "was" from "now." A screen reader announces two adjacent numbers with no indication which is the discounted one.

**Why here:** `ProductPricing` has exactly two consumers — `ProductCard` (out of scope, already shipped, correctly left alone by `feature/ui-product-grid`) and `ProductInfo`/Product Detail (this branch, at `size="lg"`, the page's primary purchase-decision point). The governing roadmap (`docs/plans/ui-architecture-review.md` §6, item 8, already quoted above) explicitly names this branch as the fix's home. Product Detail is also the more natural place for it: it's the richer, "more room to show it" context, and the one page whose entire purpose is presenting this exact decision clearly.

**Exact change:** swap the regular-price `<span>` for a semantic `<del>` element (kept visually identical — the existing `line-through` Tailwind class stays, `<del>`'s own default user-agent strikethrough is redundant with it, not a conflict). Add visually-hidden (`sr-only`) labels — e.g. `<span className="sr-only">Regular price: </span>` before the struck-through amount, `<span className="sr-only">Now: </span>` (or "Sale price: ") before the emphasized one — so a screen reader announces "Regular price: $29.99, Now: $19.99" instead of two bare numbers.

**What this deliberately does not do:** it does not touch color. The sale price stays `text-foreground` exactly as `feature/ui-product-grid` decided (that decision — rejecting `--primary` as bare text — is not reopened, only reconfirmed; see §4 item 6 for the stale doc text this branch also cleans up as a direct consequence). No `className`/visual output changes for either `ProductCard` or `ProductInfo`'s consumption of `ProductPricing` — this is markup-only.

**Explicit note on the shared-component nuance:** `ProductPricing.tsx` is nominally listed as "not to be modified" only in the sense that `feature/ui-product-grid` deliberately left it alone for a *different* (color) reason; it isn't on this branch's own out-of-scope list, and a component-level accessibility fix can't be applied "only for Detail's usage" since it's one component. Fixing it here necessarily also benefits `ProductCard`'s rendering of the same markup — flagged as a real, unavoidable cross-component side effect of a non-visual accessibility fix, not scope creep into `ProductCard`'s presentation (nothing about how `ProductCard` looks changes).

---

## 9. Design-token usage

No new token is required. Every proposed change consumes tokens `feature/ui-tokens` already shipped and `feature/ui-product-grid` already put into real use:

- `AddToCartButton`'s accent color: automatic, via `Button`'s existing `default` variant (`bg-primary text-primary-foreground`) — no new usage, no new token.
- `ProductMeta`'s proposed new rows (if approved) reuse the exact same `dt`/`dd`/`Badge` pattern already used for `producer`/`productType` — `text-muted-foreground`, `text-foreground`, no new color.
- No shadow/elevation token is proposed anywhere in this plan — `ProductGallery`/`ProductInfo` are not being given `ProductCard`-style card chrome (see §15, "card-style elevation on Gallery/Info" is deliberately excluded as an unjustified Sample Select import, not a missing token).
- No spacing value outside the existing Spacing Scale is used anywhere in this plan.

If the architecture review identifies a genuinely missing semantic role while evaluating this plan, it should be raised explicitly rather than added silently during implementation — none was found during this audit.

---

## 10. Responsive behavior

- The `md:grid-cols-2` fix (§4 item 1) is the only breakpoint change — mobile (<768px) stays single-column, tablet (768–1024px) gains the two-column split the design system already claims exists, desktop/large-desktop unaffected (already two-column via the old `lg:` threshold, which `md:` only widens the range for, not narrows).
- `AddToCartButton` at `lg` size stays full-width-capable within its flex column at every breakpoint — no crowding risk, single button, no siblings competing for the row.
- `ProductMeta`'s existing `flex-wrap` on category/tag `Badge` rows already handles overflow at narrow widths; new BPM/Key/Format rows (if approved) follow the same `dt`/`dd` row pattern, which already wraps content correctly at mobile widths (verified structurally — same pattern as `producer`/`productType`, already responsive).
- `ProductGallery`'s secondary-image `<ul>/<li>` conversion (§4 item 2) is non-visual — the existing `grid grid-cols-4` classes move onto the `<ul>` unchanged, so responsive behavior (currently: fixed 4 columns at every breakpoint, already the case today) is identical before and after.

---

## 11. Accessibility requirements

1. **Sale/original price semantics** — the core fix, §8.
2. **Price contrast** — confirmed: neither `ProductPricing` nor any change in this plan uses `--primary` as bare text; `text-foreground`/`text-muted-foreground` are unchanged, already-verified tokens. No new contrast question is raised by this branch.
3. **Add-to-cart controls** — `size="lg"` is `h-9` (36px), an improvement over the current `h-8` (32px) but still under `design-system.md`'s own aspirational 44px touch-target minimum (though it clears WCAG 2.5.8 AA's 24×24px baseline comfortably). This is the same pre-existing, already-documented, project-wide `Button`-primitive gap `feature/ui-product-grid` also found and correctly deferred — flagged here again rather than silently repeated, still correctly out of scope for a single-component branch, still `feature/ui-polish`'s to fix systemically.
4. **Image alt text** — already compliant; both `product-card.mapper.ts` and `product-gallery.mapper.ts` establish fallback alt text when WooCommerce's own alt field is empty. No change needed.
5. **Keyboard navigation** — no new interactive element is introduced (the new icon on `AddToCartButton` is `aria-hidden`, adds no tab stop; `ProductGallery`'s secondary images stay non-interactive, consistent with the standing no-lightbox deferral). No regression risk.
6. **Focus states** — every touched interactive element (`AddToCartButton`) already uses the shared `focus-visible` ring via the `Button` primitive; no custom focus styling is introduced or needed.
7. **Touch target sizing** — see item 3 above. Also applies to `ProductMeta`'s category `Badge`-as-`Link` (h-5/20px) — a pre-existing gap, not introduced by this plan, not fixed here (fixing it means resizing `Badge` generally, a shared-primitive change rippling into `ProductCard`'s sale badge too — out of this branch's footprint, `feature/ui-polish`'s territory).
8. **Responsive layout** — §10.
9. **Interactive gallery behavior** — none exists; confirmed still correctly deferred (§2 audit), not built here.
10. **Reduced-motion** — this plan introduces zero new transitions/animations (no hover-shadow or scale treatment is proposed for Gallery/Info, deliberately — see §15). Reconfirms `feature/ui-product-grid`'s finding that this codebase has no `prefers-reduced-motion` handling anywhere yet; since nothing new is added here, there's nothing new to gate, and the systemic gap remains correctly assigned to `feature/ui-polish`.

---

## 12. Verification plan

Same shape as the prior two branches, adjusted for this branch's actual surface:

1. `npx tsc --noEmit` and `npm run lint` — real components change, not a no-op safety net.
2. `npm run build` — confirms `/products/[slug]` (and any other route composing these components) builds cleanly.
3. **Real product data**, not only the `app/dev/product-detail` fixture — verify against the live WooCommerce backend if reachable in the implementation session (a real on-sale product and a real non-sale product, matching `feature/ui-tokens`'/`feature/ui-product-grid`'s discipline of temporary test data, created and removed, store re-confirmed clean after). The `app/dev/product-detail` fixture page already covers both a normal product and a no-artwork/no-sale edge case and is a useful first-pass check either way.
4. **Light and dark theme** — particularly the `<del>`/`sr-only` markup (no visual difference expected, confirm none occurred) and `AddToCartButton`'s larger size in both themes.
5. **Responsive/mobile** — confirm the `md:` two-column switch actually looks right at real tablet widths (768–1023px), not just wider; confirm mobile (<768px) is unaffected.
6. **Keyboard/focus** — tab through the page (breadcrumb links → gallery, if any focusable elements exist inside it → `AddToCartButton` → `ProductMeta` category/tag links) and confirm a visible focus ring at every stop, no trap, logical order.
7. **Accessibility/contrast** — screen-reader spot check (or a browser accessibility-tree inspection) confirming the sale price now announces distinguishably; no new bare-`--primary`-as-text usage anywhere in the diff.
8. **Sale-price behavior** — confirm both the on-sale and non-sale rendering paths (regular-only vs. regular+sale) both changed correctly for the `<del>`/`sr-only` markup, in both `ProductCard` and `ProductInfo` (shared component).
9. **Add to Cart behavior** — confirm the existing `useActionState`/server-action flow (add to cart, pending state, success/error message) is unaffected by the size/icon change — this is a presentation-only change to the `<Button>` inside an unchanged component otherwise.
10. **Existing Detail Pattern error/loading behavior** — confirm `loading.tsx` still renders correctly with the updated breakpoint (nothing visibly jumps once content arrives), confirm `error.tsx` and the `DetailNotFound` not-found path are both still reachable and unchanged in behavior (a quick regression check, since neither is being modified, but both compose the same page file that is).
11. `git diff --name-only` confirms `services/`, `graphql/`, `types/`, `lib/apollo/`, and every other `app/**/page.tsx` route outside `app/products/[slug]/` are untouched.

**Real-browser verification:** plan to use it if a browser-automation connector is available during implementation (as `feature/ui-tokens`'s session had); if not (as `feature/ui-product-grid`'s session didn't), fall back to the same structural/HTML verification against the dev server and fixture page that branch used, and say so explicitly in the implementation report rather than claiming a browser pass that didn't happen.

---

## 13. Documentation updates

- **`docs/design-system.md`** — Product Detail Anatomy: record the corrected breakpoint, the `AddToCartButton` size/icon decision, and the new meta rows (if §4 item 4 is approved). Colour System's Accent row and (pending reviewer sign-off) Product Card Anatomy's Pricing row: remove the now-incorrect "or Accent" text for sale-price color (§4 item 6).
- **`docs/decisions.md`** — one new ADR entry covering: the `ProductPricing` semantic-markup decision and why it belongs here (§8), the breakpoint correction, the `AddToCartButton` change, and the domain-data surfacing decision (if approved) — decision only, no token values restated, matching established discipline.
- **`docs/plans/ui-architecture-review.md`** — only if the reviewer agrees to §4 item 7's roadmap-dependency correction.
- Per this branch's explicit documentation discipline: nothing moves from `docs/plans/` into the canonical docs until implementation actually ships — this plan stays a plan until then.

---

## 14. Risks and architectural considerations

- **§4 item 4 (domain-data surfacing) is the one mapper-touching change in this plan** — flagged, not assumed, exactly as this branch's scope rules require. Low technical risk (additive, nullable-safe fields), but it's a real scope decision the architecture reviewer should make explicitly, not infer from silence.
- **`ProductPricing` is shared with `ProductCard`.** The §8 fix is accessibility-markup-only with no visual/color change, so it shouldn't reopen `feature/ui-product-grid`'s approved sale-badge/hover-elevation work — but because it's one component, there's no way to fix Detail's copy without also fixing `ProductCard`'s. Called out explicitly rather than left as a silent side effect.
- **The two stale "Text Primary or Accent" doc lines span two branches' territory.** One (Colour System) is squarely this branch's to fix; the other (Product Card Anatomy) technically belongs to `feature/ui-product-grid`'s section. Recommending fixing both here anyway (same fact, trivial correction) but flagged for explicit sign-off per branch-discipline instructions, not decided unilaterally.
- **The roadmap's `ui-audio-preview` dependency for this branch no longer matches reality.** Flagged (§4 item 7) rather than silently worked around — this plan proceeds without audio preview regardless of how that flag is resolved, since every gap here is independent of it.
- **Touch-target sizing remains only partially addressed by this plan** (`AddToCartButton` improves from 32px to 36px, still short of 44px; `ProductMeta`'s Badge-as-link stays at 20px). This is a known, already-documented, systemic `Button`/`Badge` limitation this project has consistently and correctly deferred to `feature/ui-polish` rather than half-fixed component-by-component — this branch continues that pattern rather than breaking it.
- **Maintainability:** every proposed change routes through existing primitives/tokens (`Button`, `Badge`, `ProductPricing`, `--primary`, the Spacing Scale) — this branch introduces no new component, no new color, no new spacing value, and (pending §4 item 4's approval) at most one small mapper extension.

---

## 15. Follow-up work deliberately excluded from this branch

- **Audio preview** (`AudioPreviewButton`, wiring `previewUrl` into `ProductGallery`) — its own already-planned branch, `feature/ui-audio-preview`. Not pulled in here (§4 item 7).
- **Trust cards, payment-method icons, an FAQ accordion, star ratings** — the architecture review itself already flagged these as content-dependent and unbacked by any real data in the current domain model (no rating/review field exists on `MusicProduct`). Not proposed here either; would be fabricating content to look like Sample Select, exactly what this branch's guiding principle rules out.
- **"Read more" / expandable description truncation** — no overflow problem was actually observed in the current implementation or fixture data; adding collapse/expand behavior now would be copying Sample Select's *mechanism* without a TSS-side problem it solves. Revisit only if real, long product descriptions turn out to need it.
- **Gallery click-to-swap/lightbox** — still no real multi-image product to validate that interaction against; the existing deferral (`docs/decisions.md`) stands unchanged.
- **Systemic `Button`/`Badge` touch-target sizing** (44px minimum) — `feature/ui-polish`, as already established by `feature/ui-product-grid`'s own identical deferral.
- **`ProductFilters`** — confirmed out of scope, already has its own roadmap item (`feature/ui-product-filters`); not touched or referenced by any change in this plan.
- **Quantity controls on Product Detail** — deliberately out of scope; a Cart-architecture decision (adjust quantity from `/cart`), not a Product Detail presentation gap.
