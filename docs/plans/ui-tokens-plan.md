# Implementation Plan: `feature/ui-tokens`

**Governing document:** `docs/plans/ui-architecture-review.md`, §6 item 1 and §5 (Design System Updates)
**Status:** Planning only. No code has been written or committed for this branch. Waiting for architecture review approval before implementation begins.

---

## Branch objective

Establish the design-token foundation the rest of the Sample Select UI-modernization roadmap (`feature/ui-header-nav` through `feature/ui-polish`) will consume. Concretely: turn the color/shadow tokens `docs/design-system.md` already specifies but marks **(proposed)** into real, implemented values in `app/globals.css`, and verify the wiring and contrast of everything already in play.

This branch changes **what a token resolves to**, never **which token a component references**. Confirmed by auditing every current consumer (below): no component in this codebase reaches past the semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-primary`, `text-destructive`, etc.) to a hardcoded color — a repo-wide grep for raw hex/oklch/rgb values or non-semantic Tailwind palette classes (`bg-orange-500`, `text-amber-600`, etc.) outside `app/globals.css` returned zero matches. That means this branch's entire code surface is very likely one file: `app/globals.css`.

---

## Exact files expected to change

| File | Change |
|---|---|
| `app/globals.css` | Add real values for `--primary`/`--primary-foreground` (the Accent role), add `--success`/`--success-foreground`, `--warning`/`--warning-foreground`, `--destructive-foreground`, add `--shadow-sm/md/lg/xl`, register the new color/shadow keys in the `@theme inline` block so Tailwind generates the matching utility classes (`bg-success`, `shadow-md`, etc.) — following the exact `--color-x: var(--x)` indirection pattern already used for every existing token. |
| `docs/design-system.md` | Flip every token this branch implements from **(proposed)**/**Status: proposed** to **Exists**, record the actual shipped oklch/shadow values (not just the starting recommendation), and correct the `--font-sans` "Implementation note" — see Documentation Updates below. |

No `.tsx`, `.ts`, service, mapper, DTO, or route file is expected to change. If implementation surfaces a real reason one needs to, that's a scope signal to raise before proceeding, not something to fold in silently.

---

## New tokens to introduce

All values below are `design-system.md`'s own existing starting recommendations (already written down, "pending sign-off," not new proposals invented for this plan) — this branch's job is to implement and verify them, not choose new numbers.

### Color

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--primary` (Accent role) | `oklch(0.7 0.15 75)` | `oklch(0.78 0.15 75)` | Warm amber/gold. `design-system.md`'s Colour System table already maps the semantic "Accent" role onto the **existing** `--primary` variable — this is a value change to a token that's already wired everywhere it needs to be (see "Existing tokens to migrate," which is empty for exactly this reason). |
| `--primary-foreground` | *(verify against new `--primary`)* | *(verify against new `--primary`)* | Currently `oklch(0.985 0 0)` / `oklch(0.205 0 0)` — near-white / near-black text on the primary surface. Must be re-verified for contrast once `--primary` is no longer neutral (see Accessibility Verification Plan); may not need to change, but that has to be confirmed, not assumed. |
| `--success` | `oklch(0.6 0.14 152)` | `oklch(0.72 0.16 152)` | No current consumer — see below. |
| `--success-foreground` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | |
| `--warning` | `oklch(0.75 0.16 80)` | `oklch(0.8 0.16 80)` | No current consumer — see below. |
| `--warning-foreground` | `oklch(0.145 0 0)` | `oklch(0.145 0 0)` (same both themes) | Deliberately identical in both themes — amber/yellow hues stay perceptually light even as a "dark" token, so dark text stays the higher-contrast choice either way. `design-system.md` calls this out explicitly; worth a one-line comment in `globals.css` so a future editor doesn't "fix" it into asymmetry. |
| `--destructive-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` (same both themes) | `--destructive` already exists and is already consumed (destructive button/badge variants, several inline error messages); its foreground pair does not exist yet. No current consumer needs it today — button/badge destructive variants use a tinted low-opacity fill (`bg-destructive/10 text-destructive`), not a solid fill needing a contrasting foreground — so this is being added for completeness/forward compatibility, not to unblock an existing broken state. |

### Shadow / elevation

| Token | Light value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.04)` | Inputs, small controls |
| `--shadow-md` | `0 2px 8px rgb(0 0 0 / 0.06)` | Resting card elevation |
| `--shadow-lg` | `0 8px 24px rgb(0 0 0 / 0.08)` | Hover elevation, dropdowns, popovers |
| `--shadow-xl` | `0 16px 48px rgb(0 0 0 / 0.12)` | Modals, dialogs |

**Open decision this branch must resolve, not defer:** `design-system.md` gives light-mode shadow values but is deliberately non-prescriptive about dark mode ("reduce shadow opacity further if one is used at all, don't just reuse the light-mode values"). Implementation needs to pick actual dark-mode values, not leave a TODO — reasonable default direction: lower each shadow's opacity by roughly half and confirm visually against `.dark`'s `--card`/`--background`, per the document's own preference for a border/lighter-surface cue over a darker shadow. This is a small, contained decision appropriate to make inside this branch (it's still "define the token," not "use the token").

No current consumer of any shadow token exists in the codebase today (shadows are entirely unimplemented, matching `design-system.md`'s "(Proposed — no shadow tokens exist in `app/globals.css` yet.)"). Same status as success/warning: real vocabulary for later branches, not retrofitted onto anything today.

---

## Existing tokens to migrate

**None.** This is the one item on the requested list with a genuinely empty answer, and it's worth stating explicitly rather than leaving implicit: a full-repo audit of every `bg-primary`/`text-primary`/`border-primary` reference found exactly two consumers, both shared primitives —

- `components/ui/button.tsx` (`default` and `link` variants)
- `components/ui/badge.tsx` (`default` and `link` variants)

Every "Add to Cart," "Place order," "Continue shopping," etc. button in the app renders through `Button`'s `default` variant. Because `--primary` is already the token these primitives consume, giving `--primary` a real value automatically re-colors every default-variant button and badge across the whole storefront — with zero lines of component code touched. This is exactly the roadmap's stated goal ("make future storefront branding possible without changing component code") and is the reason this branch can stay a pure token change.

**A naming collision worth flagging so it isn't rediscovered mid-implementation:** shadcn's scaffold already defines a *separate*, currently-unused CSS variable pair literally named `--accent`/`--accent-foreground` in `app/globals.css` (currently `oklch(0.97 0 0)`, a near-white hover-tint role — standard shadcn convention for muted interactive backgrounds, not consumed anywhere in this codebase yet). This is **not** the same thing as `design-system.md`'s semantic "Accent" role, which its own token table maps onto `--primary`, not onto shadcn's `--accent`. Implementation must assign the new amber value to `--primary`, not to shadcn's `--accent` — redefining the wrong variable would leave every button's actual rendered color unchanged (they don't consume `--accent`) while silently repainting shadcn's internal hover-tint role instead. Recommend a one-line clarifying note in `design-system.md`'s Colour System section pointing out this collision, so the next person reading "Accent" in the doc doesn't reach for the wrong CSS variable. Renaming shadcn's `--accent` to something less confusing is a legitimate future cleanup but is out of scope here — it would touch component internals this branch isn't meant to.

---

## Components expected to be touched

**None**, based on the audit above. If implementation finds a real component-level defect blocking a token from working correctly, that's grounds to pause and flag it — not to expand this branch's footprint quietly.

One deliberately-excluded borderline case, called out so it isn't assumed forgotten: `components/commerce/ProductPricing/ProductPricing.tsx`'s emphasized/sale price currently renders in `text-foreground`, while `design-system.md`'s Colour System section lists "the sale-price emphasis" as one of Accent's intended uses. Swapping that one class to `text-primary` is a one-line change, but it's a visible change to how `ProductCard`/`ProductInfo` render prices — squarely inside what the review's roadmap assigns to `feature/ui-product-grid`/`feature/ui-product-detail`, not this branch. Recommend leaving `ProductPricing` untouched here and letting the product-grid branch decide whether sale price should adopt the accent color as part of that branch's own restyle pass.

## Components explicitly not touched

Per the branch's explicit out-of-scope list — `ProductCard`, `ProductGrid`, `Hero`, `Header`, `Navigation`, `Footer`, `CartTable`/`CartSummary`, `CheckoutForm`/`CheckoutOrderSummary`, `ProductGallery`/`ProductInfo`/`ProductPricing`/`ProductMeta`, `Breadcrumbs`, `ProductFilters`, `SearchForm`, `AddToCartButton`, and every page (`app/**/page.tsx`) — none of these need or get code changes in this branch. They will visually update wherever they already consume `--primary`/`--destructive` (via `Button`/`Badge`) purely as a side effect of the token values changing underneath them; that's expected and is the point, not scope creep.

---

## Accessibility verification plan

`design-system.md`'s own Accessibility Principles section requires WCAG AA (4.5:1 body text, 3:1 large text/UI components) verified against **both** `--background` and `--card`, in both themes, before a color ships — and notes this is "binding on the proposed Accent/Success/Warning color values above once a final hue is chosen." That verification has never been possible before this branch, because none of these tokens have had a real value until now.

Concrete checks required before this branch is considered done:

1. **`--primary-foreground` on `--primary`** (button label text) — light and dark. This is the highest-traffic pairing in the whole system (every default button/badge).
2. **`--primary`** used as text or a border/ring color (links, focus-adjacent use) — against `--background` and `--card`, light and dark.
3. **`--success-foreground` on `--success`**, **`--warning-foreground` on `--warning`**, **`--destructive-foreground` on `--destructive`** — same pairing check as #1, for each new semantic color, both themes.
4. **`--warning-foreground`'s** intentionally-identical light/dark value re-verified specifically in the dark pairing — confirming the "stays dark text either way" call in `design-system.md` actually holds at the real chosen `--warning` value, not just asserted.
5. Record the actual computed ratios (not just "checked, passed") in `design-system.md` next to each token — turning "binding... once a hue is chosen" into a verified fact instead of a standing obligation.

**Method:** no contrast-checking tooling is installed in this repo (no `axe-core`, no visual-regression suite — confirmed via `package.json`, which has only `lint`/`dev`/`build`/`start`). This branch does not add one; that would be tooling/process work beyond "establish the token foundation." Recommend computing ratios directly (WCAG relative-luminance formula, or a browser devtools color picker's built-in contrast readout against the rendered token) as a one-time manual verification step during implementation and review, not a new automated check added to CI. If the team wants contrast regression testing going forward, that's a reasonable candidate for its own small follow-up, not something to fold into this branch.

---

## Build and regression verification plan

Given no test suite exists beyond linting, verification for this branch is:

1. `npx tsc --noEmit` — should be a no-op either way, since no `.tsx`/`.ts` files change; run anyway as a cheap safety net.
2. `npm run lint` — same reasoning.
3. `npm run build` — confirms the new `@theme inline` entries compile to valid Tailwind utilities and nothing in the CSS pipeline breaks.
4. **Manual visual pass**, `npm run dev`, both themes (`prefers-color-scheme` and, once wired, any in-app theme toggle) — since this project has no visual-regression tooling, this is the real regression check:
   - Every page that renders a default-variant `Button` (Add to Cart on a product detail page, Checkout's "Place order," Cart's "Proceed to Checkout," etc.) — confirm the new amber renders correctly and legibly, not just "compiles."
   - Every page that renders a `destructive`-variant control or an inline `text-destructive` error message (Cart's remove button, every `error.tsx` boundary, Checkout's validation errors) — confirm nothing regressed now that `--destructive-foreground` exists alongside it.
   - Confirm no `bg-accent`/`text-accent-foreground` usage was accidentally introduced or relied upon anywhere (there shouldn't be any — see the naming-collision note above).
5. Spot-check that `Geist Sans` is actually the rendered font (see next section) — this branch is a reasonable place to close out that verification permanently, whichever way it resolves.

---

## Documentation updates required after implementation

- **`docs/design-system.md`, Colour System table:** flip `--primary`/Accent, `--success`, `--warning`, `--destructive-foreground` from "(proposed)"/"pending sign-off" to "Exists," with the actual shipped values and the verified contrast ratios from the Accessibility Verification Plan above.
- **`docs/design-system.md`, Shadow system:** flip from "(Proposed — no shadow tokens exist in `app/globals.css` yet.)" to "Exists," including whatever dark-mode values implementation lands on (see the open decision noted above) — the dark-mode numbers need to be written down somewhere; this is that somewhere.
- **`docs/design-system.md`, the Accent-vs-shadcn's-`--accent` naming collision** — add the one-line clarifying note described above, so this isn't rediscovered by whoever implements `feature/ui-header-nav` next.
- **`docs/design-system.md`, Typography → Implementation note (the `--font-sans` self-reference claim) — likely needs correcting, not fixing.** Verified directly against the current `app/globals.css` and `app/layout.tsx` while writing this plan: `--font-sans: var(--font-geist-sans);` is already correctly wired in the `@theme inline` block, and `Geist`/`Geist_Mono` are already loaded via `next/font/google` with matching CSS variable names. The self-reference bug the document currently describes (`--font-sans: var(--font-sans)`) does not exist in the code as it stands today — it may have already been fixed in an earlier branch without the doc being updated, or the note may predate the actual implementation. **This branch's job here is to confirm the fix is real** (render a page, inspect computed `font-family` in devtools, confirm it resolves to Geist Sans and not a fallback) and then correct `design-system.md`'s Implementation Note to match reality — either removing it if fully resolved, or narrowing it if something more subtle remains. Do not "re-fix" code that isn't actually broken.
- **`docs/decisions.md`:** a short new entry recording this branch's actual token values (once chosen/verified) and the two non-obvious findings above (the `--accent` naming collision, the stale `--font-sans` note) — consistent with how every prior branch in this project has documented its real, live-verified findings rather than leaving them implicit in a diff.

---

## Risks or architectural considerations

- **The `--primary`-vs-`--accent` naming collision (above) is the single highest-risk item in this branch.** Getting it wrong doesn't break the build — it silently ships a token change that has no visible effect anywhere, because nothing consumes `--accent`. This is the kind of mistake that only surfaces when the *next* branch (`feature/ui-header-nav`) goes looking for why the header still looks monochrome.
- **Dark-mode shadow values are underspecified in `design-system.md`** and require a real decision inside this branch rather than a placeholder — flagged above, not deferred.
- **`--primary-foreground`'s contrast is currently unverified against the new `--primary`.** It's inherited from the old neutral scaffold value; there's no guarantee near-white text still reads correctly on a mid-lightness amber without checking (see Accessibility Verification Plan, item 1 — this is the item most likely to actually need a value change, not just a value confirmation).
- **Success and warning tokens ship with zero real consumers.** That's intentional and matches this branch's "foundation, not redesign" framing, but it does mean these two tokens can't be fully accessibility-verified in the way `--primary`/`--destructive` can be (there's no rendered instance to inspect in context yet) — the verification for these two is necessarily against the raw token pairing in isolation, not against a real component. Worth being explicit about that limitation rather than claiming a false equivalence with the `--primary` verification.
- **Scope discipline is the main architectural risk, not the technical work.** The token change itself is close to mechanical; the risk is a future branch (or a well-meaning mid-implementation addition to *this* branch) reaching for "while I'm in here" component restyling — e.g., the `ProductPricing` sale-price case above is exactly the kind of one-line change that's tempting to just do here. Recommend treating anything that changes a `.tsx` file's rendered output as a hard stop for this branch, full stop, even when the change is trivial.
- **No CI/automated regression coverage exists to catch a bad token value before merge.** This isn't a gap this branch should try to close (that's tooling investment, not token work), but it does mean the manual verification plan above is the *only* safety net — worth the team treating it as a real review gate, not a formality.
