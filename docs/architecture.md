# Architecture

## Overview

This is a headless commerce build: WordPress/WooCommerce owns product,
order, and customer data; the Next.js app in `frontend/` is a separate
client that reads and writes that data exclusively through GraphQL. The two
sides never share process, templates, or PHP — the only contract between
them is the GraphQL schema.

```
┌─────────────────────┐        GraphQL         ┌──────────────────────────┐
│   Next.js frontend   │ ─────────────────────> │      WordPress admin      │
│   (this project)     │ <───────────────────── │   WooCommerce + WPGraphQL │
└─────────────────────┘                         └──────────────────────────┘
```

## Backend

- **WordPress** — content and auth.
- **WooCommerce** — products, cart, checkout, orders.
- **WPGraphQL** + **WPGraphQL for WooCommerce** — exposes the above as a
  single GraphQL schema at one endpoint.
- **MariaDB** — storage.
- **Nginx** — serves WordPress and proxies the GraphQL endpoint.

The frontend has no direct database or REST access — everything goes
through the GraphQL endpoint configured via `NEXT_PUBLIC_GRAPHQL_ENDPOINT`
(see [setup.md](setup.md)).

## Frontend

- **Next.js (App Router)** + **TypeScript** — routing and rendering.
- **Apollo Client** — GraphQL client, cache, and network layer.
- **Tailwind CSS v4** + **shadcn/ui** + **Radix UI** — styling and
  accessible component primitives.

Project files live at the frontend project root (not under `src/`), which
is the convention `shadcn`'s `components.json` and `tsconfig.json` already
established — `@/*` resolves to the project root.

## GraphQL flow

Request (component asking for data) and response (data becoming something
a component can render) are different pipelines:

```
React Component
   │  calls a service function, never a query directly
   ▼
Service (services/*.service.ts)
   │  runs a typed query/mutation via Apollo Client
   ▼
Apollo Client (lib/apollo/ — see below)
   │  HttpLink → NEXT_PUBLIC_GRAPHQL_ENDPOINT
   ▼
WPGraphQL (WordPress)
```

```
WPGraphQL Response
   │  shaped exactly like the query that requested it
   ▼
WooCommerce DTO (types/dto/*.dto.ts)
   │  typed to mirror that response — WooCommerce's field names,
   │  connection wrappers, and nullability, nothing translated yet
   ▼
Mapper (services/mappers/*.mapper.ts)
   │  the only code that knows both the DTO and the domain shape
   ▼
MusicProduct (types/*.ts)
   │  what every component actually depends on
   ▼
Services -> React Components
```

DTOs are written from live WPGraphQL schema introspection, not guessed —
see [decisions.md](decisions.md) for how and why. `types/dto/woocommerce-product.dto.ts`
is the first one, scoped to `SimpleProduct`.

Why the DTO is a separate stage from the domain type, not folded into the
mapper's input: see [product-model.md](product-model.md#dto-layer). Short
version — a DTO typed to a specific query catches breakage from a changed
query or schema at compile time; skipping it means the mapper's input is
only as reliable as an untyped or loosely-typed raw response.

GraphQL documents live under `graphql/queries/`, `graphql/mutations/`,
`graphql/fragments/` — created as each is actually needed (`queries/` and
`fragments/` now exist; `mutations/` will follow the first mutation).
Nothing outside `graphql/` writes GraphQL syntax.

`lib/apollo/` has two client entry points, not one, because Server
Components and Client Components need different lifetimes:

- `client.ts` + `provider.tsx` — a client-side client (`ApolloNextAppProvider`),
  a true singleton in the browser, used by any `"use client"` component
  that calls `useQuery`/`useMutation`.
- `rsc-client.ts` — a request-scoped client (`registerApolloClient`), used
  by `async` Server Components that fetch data server-side and never need
  a browser cache.

Both build on `links.ts` for the actual network link, so the endpoint and
future auth/logging/retry links stay defined in one place regardless of
which client uses them. See [decisions.md](decisions.md) for why a single
shared client instance isn't safe for either case.

## Service layer

`services/` is the only layer allowed to call Apollo Client directly.
Each service (e.g. `product.service.ts`) exposes plain async functions —
`getProduct`, `getProducts`, etc. — that return typed domain data such as
`MusicProduct` (`types/music-product.ts`), or `null` when a single
resource genuinely doesn't exist (`getProduct` — see "Page architecture
patterns" below and docs/decisions.md for why that's a valid return, not
an error). Components import from services, never from `graphql/` or
`lib/apollo/client.ts`.

`services/mappers/` holds the transformation from a WooCommerce DTO to a
domain type — see the GraphQL flow diagram above. A service calls its
mapper internally; components never see the intermediate DTO.

This keeps GraphQL response shapes, fetch policies, and error handling out
of components entirely, and means the schema can change without touching
UI code (only the mapper that translates it).

A service function that fetches a *page* of a connection — `getProductsPage`
today, the pattern for any future paginated listing (category pages,
search results, collections) — returns both the mapped domain data and
the connection's `pageInfo` (`hasNextPage`/`endCursor`), not just the flat
array. Pages consume `pageInfo` to render "next page" navigation; a
`getX` wrapper (e.g. `getProducts`) stays available for callers that only
ever want the flat list. See docs/decisions.md, "Product Catalog" for the
full reasoning.

## Page architecture patterns

Two page shapes are established, and future pages should extend one of
these rather than invent a third. Both compose the same underlying
pieces (service -> presentation mapper -> presentation components) and
both use the same three-file Next.js convention (`loading.tsx`,
`error.tsx`, plus whatever handles "valid but nothing to show") — they
differ in what "nothing to show" means and how pagination applies.

### Listing pages

Example: `app/products` (`feature/product-catalog`).

```
service (getXPage: { items, pageInfo }) -> items.map(toXCard) -> XGrid -> page
```

- **`loading.tsx`** — a `Suspense`-boundary skeleton matching the grid's
  real layout (`XGridSkeleton`, sharing literal layout code with the real
  grid component so the two can't visually drift apart).
- **Empty state** — zero results is a normal, valid business state
  (a new store, an over-narrow filter), not an error: a plain conditional
  inside the page component, never routed through `error.tsx`.
- **Pagination** — cursor-based (`?after=<cursor>`), driven by the
  service's `pageInfo.hasNextPage`/`endCursor`; "previous" relies on the
  browser's own back navigation rather than backward cursor args the
  underlying query doesn't request (see docs/decisions.md for why that's
  a deliberate scope boundary, not a gap).
- **`error.tsx`** — a thrown fetch error (network/GraphQL failure), not
  caught in the page component, reaches this Next.js error boundary.
- **Metadata** — `generateMetadata` sets `noindex`/canonical-back-to-page-one
  for any non-first page, since cursor pagination has no stable per-page
  URL worth indexing separately.

### Detail pages

Example: `app/products/[slug]` (`feature/product-detail`).

```
service (getX: X | null) -> toXInfo/toXGallery -> reusable presentation components -> page
```

- **`loading.tsx`** — same `Suspense` pattern, sized to the detail
  layout (gallery + info skeletons) instead of a grid.
- **"Nothing to show" is `notFound()`, not an empty state.** A single
  resource either exists or it doesn't; there's no equivalent of "zero
  results, still a valid page." The service returns `X | null`; the page
  calls Next's `notFound()` when it's `null`, which renders
  `not-found.tsx` (automatically `noindex`ed by Next, no manual metadata
  needed for that case).
- **Distinguishing "not found" from "failed" is the one subtle part.**
  A service function returning a nullable single resource needs to tell
  "the backend coherently said this doesn't exist" apart from "the
  backend didn't answer at all" — those are different states requiring
  different Apollo error-policy handling, and getting the distinction
  wrong routes a real outage to the wrong UI. See docs/decisions.md,
  "Product Detail" for the specific pitfall this project hit and how it
  was actually diagnosed (by inspecting the real resolved result shape
  for both cases, not by assumption).
- **`error.tsx`** — same as listing pages: a genuine thrown failure,
  never a normal "not found."
- **Metadata** — `generateMetadata` builds `title`/`description`/`openGraph`
  from the real fetched resource (a per-item image, unlike a listing page
  which has no single representative image to offer).

### Shared presentation components introduced for detail pages

`ProductImage` (real photo, 1:1, or a quiet placeholder — never a fake
image) and `ProductPricing` (regular/sale price display, sized `sm`/`lg`)
were factored out of `ProductCard` once `ProductGallery`/`ProductInfo`
needed the identical logic — both now compose these rather than
`ProductCard` being the only place that logic lived. `Breadcrumbs`
(`components/common/`) is fully generic (no product/commerce knowledge)
and is the reusable piece any future page more than two levels from home
should use, per docs/design-system.md's Navigation Principles.

## Folder philosophy

```
app/            routing only — pages, layouts, route handlers
components/
  ui/           shadcn primitives + Skeleton (unstyled building blocks)
  layout/       Container, Section, Header, Navigation, Footer, SkipToContent, Shell
  commerce/     ProductCard, ProductGrid, ProductImage, ProductPricing, ProductGallery,
                ProductMeta, ProductInfo (+ Skeleton loading states) — cart, checkout
                still created on first use
  music/        player, track list, waveform UI — created on first use
  marketing/    Hero, ShopByType — landing/promo sections
  common/       shared, feature-agnostic UI (e.g. Logo, Breadcrumbs)
lib/
  apollo/       Apollo Client setup — client + provider (browser), rsc-client (server), links
  env.ts        typed environment access
  config/       centralized app configuration — store.ts, routes.ts, theme.ts
  format-money.ts  Money -> display string, shared by presentation mappers
graphql/
  queries/      GraphQL queries (e.g. site-info.ts, products.query.ts, product.query.ts)
  mutations/    created on first mutation
  fragments/    GraphQL fragments (e.g. product.fragment.ts)
services/       the only callers of Apollo Client; UI's data contract
  mappers/      WooCommerce DTO -> domain type transformations
hooks/          shared React hooks — created on first use
types/          shared TypeScript types (e.g. MusicProduct)
  dto/          types mirroring WPGraphQL responses (e.g. WooCommerceProductDto)
data/           static content (e.g. product-types.ts) — distinct from lib/config — see component-principles.md
```

The rule throughout: a folder is created when the first file that belongs
in it is written, not in advance. Empty folders don't survive in git and
add nothing but noise — the target shape above is the plan, not something
to scaffold speculatively.

For how components built inside `components/` should be structured, and
the visual language they should follow, see
[component-principles.md](component-principles.md) and
[design-system.md](design-system.md).

## Configuration layer

`lib/config/` is the single source of truth for application constants —
part of the architectural contract now, not just a documented convention.
Three files, each with one responsibility:

- **`store.ts`** — store identity, currency, locale, contact info, social
  links, catalog defaults, SEO defaults, and feature flags, all typed
  through an exported `StoreConfig` interface. The interface is exported
  separately from `storeConfig` (the TSS instance of it) so a future
  Maabara storefront can define its own config of the same shape.
- **`routes.ts`** — every internal path the app links to, as named
  constants and slug-based path builders. No component should write a
  route as a string literal.
- **`theme.ts`** — numeric design constants from
  [design-system.md](design-system.md) that code needs as values (layout
  math, animation durations), not Tailwind classes. Deliberately excludes
  color/radius/shadow/icon tokens — those already exist as CSS custom
  properties in `app/globals.css` and are consumed via Tailwind utility
  classes; re-declaring them here would duplicate that configuration
  rather than centralize it.

`lib/env.ts` and `lib/config/` stay separate on purpose: `env.ts` is for
values that come from `process.env` (environment-dependent); `lib/config`
is for non-secret constants that don't vary by environment. See
[component-principles.md](component-principles.md#configuration-comes-from-libconfig).

## Layout foundation

`components/layout/Shell` is the application shell every page renders
inside — wired into `app/layout.tsx`, not something individual pages
opt into. It composes `SkipToContent`, `Header` (which composes `Logo`
from `components/common/` and `Navigation`), the page's own content
inside one `<main id="main-content">` landmark, and `Footer`.

`Container` and `Section` are the layout primitives everything else is
built from — consistent max-width/padding and consistent vertical rhythm,
both sourced from `lib/config/theme.ts` rather than hardcoded. Getting a
responsive theme.ts value into real, working CSS needs one specific
technique (`toResponsiveVars`, `lib/utils.ts`) — see
[decisions.md](decisions.md) for why a plain Tailwind arbitrary-value
class doesn't work for this and what does instead.

No commerce, cart, search, or account UI exists in `Navigation` yet — see
[decisions.md](decisions.md) for why that's a scope decision, not an
oversight.
