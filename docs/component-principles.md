# Component Principles

Architectural rules for UI components — how they're built, not how they
look. For the visual language itself, see
[design-system.md](design-system.md). For the data layer these components
sit on top of, see [architecture.md](architecture.md),
[product-model.md](product-model.md), and
[decisions.md](decisions.md).

None of this is new policy invented for this document — it's the same
boundary already established and proven working for the data layer
(`app/dev/graphql/page.tsx`, `app/dev/products/page.tsx`,
`services/product.service.ts`), made explicit as a rule components must
follow too.

---

## Server Components by default

Every component starts as a Server Component. `"use client"` is an
exception that has to be justified, not a default habit.

This isn't a style preference — it's already how the data layer works.
`app/dev/products/page.tsx` is a plain `async` function component that
calls `getProducts()` and renders the result server-side, with zero
client-side JavaScript for a page that has no interactivity. That pattern
— async Server Component, calls a service, renders — is the template for
every page and every non-interactive piece of UI in the storefront:
product grids, product detail content, category listings, footers, static
marketing sections.

## Client Components only when required

A component needs `"use client"` only if it does at least one of these:

- Uses React state or effects (`useState`, `useEffect`, etc.)
- Attaches a browser event handler that does more than navigate (`onClick`
  that opens a menu, toggles a filter, adds to cart — not a plain link)
- Reads a browser-only API (`window`, `localStorage`, media queries at
  runtime)
- Uses a library that requires the client (`framer-motion` is already a
  project dependency for exactly this — deliberate motion, not ambient
  page transitions; see design-system.md's Motion Principles)

If none of those apply, it's a Server Component. When a Client Component
is genuinely needed, keep it as small as possible — wrap just the
interactive part (e.g. an "Add to Cart" button), not the whole product
card it lives inside. A Server Component can render a Client Component as
a child; the reverse isn't true, so pushing `"use client"` as far down the
tree as possible keeps the largest possible share of the page server-only.

## Components consume canonical domain models only

A component's props are typed against `MusicProduct`
(`types/music-product.ts`) — or a narrower type derived from it — never
against `WooCommerceProductDto` (`types/dto/*.dto.ts`) or a raw GraphQL
query result type. This is the same boundary already established for the
data layer (see [product-model.md](product-model.md) and
[decisions.md](decisions.md) for why the DTO stage exists specifically so
nothing outside `services/mappers/` has to know WooCommerce's
representation).

In practice: if a component needs to import from `types/dto/` or
`graphql/` to compile, that's a boundary violation — the data it needs
should already have been shaped into domain data before it reaches the
component.

## Components never perform GraphQL operations

No component calls `useQuery`, `useMutation`, `gql`, or imports anything
from `graphql/queries/` or `graphql/mutations/`. This is already a
committed architectural decision — see decisions.md, "Why services sit
between components and Apollo Client":

```
React Components → Services → Apollo Client → GraphQL → WordPress
```

A component that fetches its own data duplicates fetch logic that should
live in one service function, can't be tested without mocking Apollo, and
breaks the moment the underlying query changes instead of the one service
that owns it.

## Services own data fetching

`services/*.service.ts` functions are the only code allowed to call Apollo
Client (`lib/apollo/client.ts` for Client Components,
`lib/apollo/rsc-client.ts` for Server Components — see architecture.md for
which is which) and the only code allowed to import a mapper
(`services/mappers/*.mapper.ts`). A service function's signature always
returns domain data (`MusicProduct`, `MusicProduct[]`, etc.), never a raw
GraphQL response or DTO.

**How data actually reaches a Client Component, given both of the rules
above:** a Server Component (a page, or a server-only wrapper) calls the
service, gets back typed domain data, and passes it down as props —
including into any Client Component further down the tree. A Client
Component that needs product data receives it as a prop; it does not call
a service itself just because "the service is right there." (An
interactive Client Component that needs to *mutate* data — add to cart,
submit a review — is the one legitimate exception, and even then it calls
a Server Action or route handler that itself uses the service layer, not
Apollo directly from the client bundle.)

## Configuration comes from `lib/config`

`lib/config/` exists (`store.ts`, `routes.ts`, `theme.ts`, `index.ts` —
see [architecture.md](architecture.md#configuration-layer) for what each
file owns). No component should hardcode a value that's really
configuration — a page size, a route path, a currency fallback, a feature
toggle, a layout constant — it belongs in `lib/config`, imported, not
inlined.

Distinguish it from `lib/env.ts`: `env.ts` is for values that come from
`process.env` — things that differ per environment. `lib/config` is for
non-secret, non-environment-specific application constants. Concrete
examples already wired up: `services/product.service.ts` reads its
default page size from `storeConfig.catalog.productsPerPage`, and
`services/mappers/product.mapper.ts` reads its currency fallback from
`storeConfig.currency.code` — neither hardcodes the value directly
anymore.

Also distinguish it from `data/` (documented in architecture.md's "Folder
philosophy," not yet created): `data/` is for static *content* — things an
editor might reasonably change, like nav structure or marketing copy.
`lib/config` is for *engineering* constants a developer sets, not content.
Not redundant — different kinds of "static values."

## Avoid duplicated styling decisions

Every color, spacing value, radius, shadow, and type size a component
uses should be a token from [design-system.md](design-system.md) — via
Tailwind's `@theme` CSS variables (`bg-background`, `text-foreground`,
`p-4`, etc.) or an existing `cva` variant (see `components/ui/button.tsx`
for the established pattern: a `cva()` call defining named variants, not
conditional className strings scattered through the component). A
one-off magic value (`className="mt-[17px]"`, a hardcoded hex color) is
always a bug — either the design system is missing a token that needs to
be added there first, or the component should be using a token that
already exists.

## Prefer composition

Favor several small, composable components over one large configurable
one. The existing `components/ui/card.tsx` already establishes this
pattern (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` as
separate composable pieces, not one `Card` with a dozen props) — follow it
for new compound components rather than building a single component that
takes a growing list of boolean/variant props to control what's
essentially a different composition each time.

A prop-heavy component that says "if `showPrice` is true and `variant` is
`compact`, render X" is a sign it should be two components, or one
component with children/slots instead of flags.

## Business capability folder structure

Reaffirming the taxonomy already documented in architecture.md's "Folder
philosophy" — this document doesn't redefine it, only clarifies what
belongs where:

```
components/
  ui/           shadcn primitives — domain-agnostic, no MusicProduct knowledge
  layout/       header, footer, nav — structural, page-independent
  commerce/     cart, checkout, pricing widgets — domain-aware, WooCommerce-adjacent concepts
  music/        player, track list, waveform UI — domain-aware, audio-specific
  marketing/    landing/promo sections — content-driven, not data-driven
  common/       shared, feature-agnostic UI that isn't a primitive (e.g. an empty state, a page-level error message)
```

`components/ui/` is the one folder that must stay completely
domain-agnostic — nothing in it should import `MusicProduct` or know a
product has a price. A `ProductCard` (domain-aware) is built by composing
`ui/` primitives (`Card`, `Badge`, `Button`); it lives in `commerce/` (or
`music/`, if it's specifically about the audio content rather than the
transaction), not in `ui/`.

Folders are created when the first real component lands in them, per the
same rule already established for the rest of the project — no empty
placeholder folders scaffolded in advance.

## Naming conventions

Consistent with what's already used throughout the codebase
(`product.service.ts`, `product-card.fragment.ts`, `music-product.ts`):

- **Component files and component names: PascalCase** (`ProductCard.tsx`,
  `PriceTag.tsx`).
- **Everything else: kebab-case** (`product.service.ts`,
  `use-cart.ts`, `format-price.ts`).
- **Props types: `<ComponentName>Props`** (`ProductCardProps`), colocated
  in the same file as the component unless shared across several
  components.
- **Boolean props: `is`/`has`/`should` prefixed** (`isLoading`,
  `hasDiscount`, `shouldAutoPlay`) — reads as a question at the call site.
- **Event handler props: `on` prefixed** (`onAddToCart`), matching React's
  own convention (`onClick`).

## File organisation

- **One component per file.** A file exports one primary component;
  tightly-coupled sub-parts that only make sense inside it (e.g. a
  `ProductCard`'s internal price display) can be colocated as
  unexported helper components in the same file, but move to their own
  file the moment anything else needs to reuse them.
- **No premature barrel files.** Don't add an `index.ts` re-exporting
  everything in a folder until that folder has enough siblings that the
  barrel earns its keep — consistent with this project's standing rule
  against unnecessary abstraction (see decisions.md throughout).
- **Colocate what's private, extract what's shared.** If a piece of UI is
  used by exactly one component, it can live inside that component's
  file or folder. The moment a second consumer needs it, it belongs in
  `common/` or `ui/`, not duplicated.

## Reusability expectations

- `components/ui/` primitives must work with any data — they accept
  primitives and callbacks as props, never a domain type.
- `components/{commerce,music,marketing}/` components are allowed to know
  about `MusicProduct` and are where domain-shaped props are expected —
  this is the layer where "reusable" means "reusable across pages that
  show products," not "reusable for arbitrary data."
- A component should be usable in Storybook-style isolation (even before
  Storybook itself is set up) — if a component can't be rendered with
  just its props and no ambient context beyond a theme/provider, it's
  reaching for something it shouldn't (usually: it should be receiving
  data as a prop instead of fetching it, per the Server/Client rules
  above).

---

## References

- [design-system.md](design-system.md) — the visual tokens these
  component rules exist to help apply consistently
- [architecture.md](architecture.md) — folder structure, GraphQL flow,
  the Server/Client Apollo client split
- [product-model.md](product-model.md) — the `MusicProduct` shape
  components consume
- [decisions.md](decisions.md) — the ADRs behind "services own data
  fetching" and related boundaries
