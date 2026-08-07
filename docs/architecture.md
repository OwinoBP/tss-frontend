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

`cart-client.ts` (`feature/cart`) is a third, purpose-built client, not a
third variant of the same pattern — cart operations are session-scoped
mutations/reads that should never be cached or deduped, so it's a plain
factory (`createCartClient()`, called fresh per call from
`cart.service.ts`) rather than either the browser singleton or the
per-request `registerApolloClient` above. It chains `session-link.ts`
(reads/writes the WooCommerce `woocommerce-session` header via Apollo's
own `context`/`operation.getContext().response` mechanism) in front of a
plain `HttpLink` — confirmed, not assumed, via a live spike before this
became the real implementation; see docs/decisions.md, "Cart".

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

`services/cart.service.ts` (`feature/cart`) is the fourth resource-scoped
service and the first that's mutation-driven and session-bound — see
"Cart" below for the full state model. Its functions are still plain async
functions returning domain data, but they take/return an explicit
`sessionToken` rather than reading `next/headers` cookies themselves,
keeping the service itself framework-agnostic; the cookie read/write is
`lib/actions/cart.actions.ts`'s job.

`GetProductsParams.where` (added in `feature/product-search`) is the
filtering hook on top of that: an object mirroring WPGraphQL's own
`RootQueryToProductConnectionWhereArgs` shape (`{ search, category }`
today), passed straight through to `PRODUCTS_QUERY`'s `where` variable.
Shaped as an object rather than flat parameters specifically so each new
listing page adds a field (`category`, added additively in
`feature/category-pages`) instead of `getProductsPage` growing a new flat
parameter per filter — `productBrand` is the next real, schema-confirmed
candidate whenever a brand listing page needs it. See docs/decisions.md,
"Product Search" and "Category Pages."

`feature/filtering-and-sorting` extended the same object again —
`minPrice`, `maxPrice`, `onSale`, and `orderby` — all confirmed live on
`RootQueryToProductConnectionWhereArgs`, including `orderby` itself,
which lives *inside* `where` in this schema rather than as a sibling
query variable. No change to `PRODUCTS_QUERY`'s GraphQL document or to
`product.service.ts` was needed for any of it: `where: $where` was
already fully generic, and `GetProductsParams.where` already passes
straight through. `lib/product-filters.ts` is the new small translation
layer this branch adds — parsing a listing page's `searchParams` into a
typed filter state, and translating a URL-facing sort slug (`?sort=price-asc`)
to WPGraphQL's `{ field, order }` shape via `data/sort-options.ts` — kept
deliberately separate from `where` itself so the public URL contract
doesn't change if the schema's enum naming ever does. See
docs/decisions.md, "Filtering and Sorting."

## Page architecture patterns

Two page shapes are established, and future pages should extend one of
these rather than invent a third. Both compose the same underlying
pieces (service -> presentation mapper -> presentation components) and
both use the same three-file Next.js convention (`loading.tsx`,
`error.tsx`, plus whatever handles "valid but nothing to show") — they
differ in what "nothing to show" means and how pagination applies.

### Listing pages

Examples: `app/products` (`feature/product-catalog`), `app/search`
(`feature/product-search` — the same pattern with a `where.search` filter
and a query-param-driven form instead of an implicit "everything" fetch;
see docs/decisions.md, "Product Search" for what, if anything, differs).

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
  URL worth indexing separately. `app/search` goes further and sets
  `noindex` on *every* state, first page included — see docs/decisions.md,
  "Product Search" for why a search listing's "page one" isn't the same
  case as the catalog's. `feature/filtering-and-sorting` extends this same
  rule to any active filter/sort param on `app/products` and
  `app/categories/[slug]` — a filtered/sorted result has no more a stable,
  indexable identity than a paginated one (`app/search` needed no change,
  already blanket-`noindex`).
- **Filtering and sorting** — `components/commerce/ProductFilters`, a
  plain GET form (no client JavaScript, an explicit "Apply" submit rather
  than auto-submit-on-change), renders on every Listing page and reads
  back into `lib/product-filters.ts`'s parsing helpers. Submitting it
  drops any existing `?after=` — a changed filter/sort invalidates a prior
  cursor — and "Next" links on all three Listing pages now preserve the
  active filter/sort state alongside the new `after` value, not just
  `after` alone. See docs/decisions.md, "Filtering and Sorting."

### Detail pages

Examples: `app/products/[slug]` (`feature/product-detail`),
`app/categories/[slug]` (`feature/category-pages`).

```
service (getX: X | null) -> toXInfo/toXGallery -> reusable presentation components -> page
```

- **`loading.tsx`** — same `Suspense` pattern, sized to the detail
  layout (gallery + info skeletons for a product; a heading/breadcrumb
  skeleton plus `ProductGridSkeleton` for a category) instead of a grid.
- **"Nothing to show" renders `DetailNotFound` (`components/common/DetailNotFound`)
  as a plain inline conditional — never `notFound()`/`not-found.tsx`.**
  A single resource either exists or it doesn't; there's no equivalent of
  "zero results, still a valid page." The service returns `X | null`; the
  page returns `<DetailNotFound title="..." message="..." actionLabel="..."
  actionHref="..." />` when it's `null`, and returns
  `DETAIL_NOT_FOUND_METADATA` (same folder) — `{ robots: { index: false,
  follow: true } }` — from `generateMetadata`'s matching branch. This is
  the project's one canonical pattern for every Detail page, not a choice
  made per page — **`notFound()`/`not-found.tsx` must not be used for a
  Detail page in this project.** See docs/decisions.md, "Detail Page
  Pattern Hardening" for the confirmed Next.js defect this avoids (a
  route segment's mere possession of a `not-found.tsx` file causes *any*
  uncaught error in that segment — not just a real `notFound()` call — to
  render the not-found boundary instead of `error.tsx`), why no official
  framework fix exists yet, and the accepted trade-off (a nonexistent
  resource now returns HTTP `200`, not `404`, mitigated by the explicit
  `noindex`).
- **`error.tsx`** — a genuine thrown failure, never a normal "not found."
  Distinguishing the two is what the `DetailNotFound` convention above
  exists to get right; see docs/decisions.md, "Product Detail" for the
  earlier, narrower pitfall this project hit distinguishing "not found"
  from "failed" at the *service* layer (Apollo error-policy handling),
  which is a separate, already-solved concern from the *page-boundary*
  defect "Detail Page Pattern Hardening" fixes.
- **Metadata** — `generateMetadata` builds `title`/`description`/`openGraph`
  from the real fetched resource when it exists (a per-item image for a
  product, unlike a listing page which has no single representative image
  to offer); returns `DETAIL_NOT_FOUND_METADATA` plus a page-specific
  `title` when it doesn't.

**`DetailNotFound` is fully generic and presentation-only** — no
knowledge of `MusicProduct`, `Category`, a slug, a resource type,
GraphQL, or services. Every Detail page supplies its own copy
(`title`/`message`/`actionLabel`/`actionHref`) as props, so the shared
component can't drift into knowing about a specific resource type. Colocated
with it, in the same folder: `DETAIL_NOT_FOUND_METADATA`, the metadata
fallback every Detail page's `generateMetadata` pairs with it.

**Category pages compose Detail and Listing, not a third pattern.** A
category page needs both halves of what's documented on this page: the
category *term* itself either exists or it doesn't (Detail-shaped, per
above); the *products inside it* are a listing where zero is a normal,
valid state (Listing-shaped, identical rules to `app/products` above —
pagination, empty state, `error.tsx`). No new page shape was introduced.
`GetProductsParams.where.category` (added in `feature/category-pages`) is
the second filter on `ProductsQueryWhere`, alongside `search` — the same
additive extension point predicted when `where` was first generalized
(see "Service layer" above and docs/decisions.md, "Product Search").
Category term metadata (name, description, breadcrumb ancestry) has no
product-shaped equivalent, so it gets its own small service
(`services/category.service.ts`) and query (`graphql/queries/category.query.ts`)
rather than being force-fit into the products query.

### Shared presentation components introduced for detail pages

`ProductImage` (real photo, 1:1, or a quiet placeholder — never a fake
image) and `ProductPricing` (regular/sale price display, sized `sm`/`lg`)
were factored out of `ProductCard` once `ProductGallery`/`ProductInfo`
needed the identical logic — both now compose these rather than
`ProductCard` being the only place that logic lived. `Breadcrumbs`
(`components/common/`) is fully generic (no product/commerce knowledge)
and is the reusable piece any future page more than two levels from home
should use, per docs/design-system.md's Navigation Principles.
`DetailNotFound` (`components/common/`, `feature/detail-pattern-hardening`)
is the equally generic "resource not found" piece every Detail page uses
instead of `notFound()`/`not-found.tsx` — see "Detail pages" above and
docs/decisions.md, "Detail Page Pattern Hardening".

## Cart

`feature/cart` adds the storefront's first persistent commerce state — a
different shape of problem from every page pattern above, so it's
documented separately rather than forced into "a third Listing/Detail
variant." Full reasoning and the Apollo-vs-raw-fetch spike that decided
the mechanism: docs/decisions.md, "Cart".

**Server-authoritative, not client-owned.** WooCommerce/WPGraphQL is the
only source of truth for cart contents, pricing, and totals — the
frontend never computes a total or maintains a cart independently. WPGraphQL
is stateless, so a guest cart is addressed by a `woocommerce-session` JWT
returned as a response header on every cart-touching request and echoed
back as a request header on the next one (confirmed live, see
docs/decisions.md). That token lives in an httpOnly cookie
(`lib/cart-session.ts`) — not `localStorage` — specifically so a Server
Component (`app/cart/page.tsx`) can read the current cart at render time,
which nothing client-side-only could do.

```
Client Component (AddToCartButton, CartTable's row controls)
   │  calls a Server Action, never a service or Apollo directly
   ▼
lib/actions/cart.actions.ts ("use server")
   │  reads the session cookie, calls the service, writes back
   │  whatever token WooCommerce returned, returns the fresh Cart
   ▼
services/cart.service.ts
   │  the only caller of cart-client.ts; framework-agnostic
   │  (takes/returns a plain sessionToken, never touches cookies())
   ▼
lib/apollo/cart-client.ts (session-link.ts + HttpLink)
   ▼
WPGraphQL cart mutations/queries
```

**`components/commerce/CartProvider` (`CartContext`/`useCart`) holds only
the latest server snapshot returned by a Server Action** — never a
client-computed patch, never something fetched independently. Two
instances exist, deliberately nested rather than one global fetch-on-every-page
provider: a global one at the root layout (`app/layout.tsx`), seeded with
`null`, that anything anywhere (e.g. `AddToCartButton` on a Product Detail
page) can write to; and `app/cart/page.tsx`'s own locally-nested provider,
seeded with that request's fresh `getCart()` result, which shadows the
global one for its subtree. This guarantees `/cart` always renders
accurate data on every navigation (React's nested-context shadowing, not a
second fetch mechanism) without requiring every other page to pay for a
cart fetch it doesn't need — see docs/decisions.md for the alternative
(a single cart-fetching root provider) and why it was rejected.

**No MiniCart, no `cart_count` cookie, in this pass.** Both were part of
the original plan but deliberately deferred until a real need for them is
shown — see docs/decisions.md. `Header` links to `/cart` as a plain text
utility nav link (routes.cart, previously unused since the configuration
branch), not a live badge.

## Checkout

`feature/checkout` adds order placement — Phase 1 scope: a billing
address, a conditional shipping address, a payment-method choice, and
order submission, ending in an inline confirmation. Full investigation,
the framework bug this branch had to design around, and the live-verified
reasoning behind every decision below: docs/decisions.md, "Checkout".

**Order gets its own domain model, via the same DTO -> Mapper -> Domain
pipeline as every other WooCommerce resource** — `types/dto/woocommerce-checkout.dto.ts`
-> `services/mappers/checkout.mapper.ts` -> `types/order.ts` (`Order`,
`OrderAddress`, `PaymentGateway`). Order carries fields (billing/shipping
addresses, order number, status, payment method) that `Cart` has no place
for, so it isn't force-fit into the Cart type — the same reasoning that
already justified Product and Category each having their own domain model
instead of a shared "WooCommerce resource" type.

**The checkout process composes the existing Cart domain, not a new one.**
`app/checkout/page.tsx` reads the live cart via the same `getCart`
`/cart` already uses (same session token, same `Cart` type) for the
read-only order summary — no separate "checkout cart" concept. What's new
is strictly the billing/shipping form, the `checkout` mutation, and the
`Order` it returns. `Cart` gained two additive fields for this
(`needsShippingAddress`, `chosenShippingMethods`) — confirmed live to
reflect real store shipping-method configuration, not just "does this
cart contain a physical product"; see docs/decisions.md.

**Session handling reuses `cart-client.ts`/`session-link.ts` directly** —
`checkout` is itself a session-scoped mutation needing the identical
`woocommerce-session` round trip as every cart mutation, confirmed live.
No new Apollo client. `services/checkout.service.ts` follows
`cart.service.ts`'s exact shape: framework-agnostic functions taking/
returning a plain `sessionToken`.

**WooCommerce enforces almost no required-field validation on `checkout`
itself** — confirmed live, an order was created with a completely empty
billing address. `lib/checkout-validation.ts` is this app's own
required-field/email-format/country-enum validation, run inside
`lib/actions/checkout.actions.ts` — HTML5 `required`/`type="email"` on
the form is a progressive-enhancement nicety, not the real check.

**A successful checkout redirects; it doesn't return a value the client
renders inline.** `lib/actions/checkout.actions.ts` calls `redirect()` to
`/checkout/success/[orderNumber]` (confirmation data as query params, from
the already-mapped `Order` — no second GraphQL call) rather than returning
`{ ok: true, order }` for a client component to hold in state. This is a
direct consequence of a confirmed Next.js 16 behavior: a Server Action
that mutates cookies (`clearCartSessionToken()`) triggers an automatic
server-side re-render of the current route bundled into the same action
response, which silently replaced an earlier inline-success design's
client state before it ever rendered — see docs/decisions.md, "Checkout"
for the full discovery.

**`order.id` (the Relay global ID) is never requested.** Confirmed live,
reproducible: resolving it on the `Order` returned by `checkout` throws
"Internal server error" for a guest order. `databaseId`/`orderNumber` are
used instead — the same `databaseId`-for-mutations precedent
`MusicProduct.databaseId` already established.

**Payment method is a real, queried list (`paymentGateways`), not
hardcoded — and this store currently has zero enabled.** All three
installed offline gateways (bacs/cheque/cod) start disabled; `CheckoutForm`
handles an empty list by disabling submission with an explicit message
rather than assuming at least one gateway exists. Enabling a gateway is a
WooCommerce admin task flagged in Known Limitations, not something this
branch's code can fix.

## Folder philosophy

```
app/            routing only — pages, layouts, route handlers
components/
  ui/           shadcn primitives + Skeleton (unstyled building blocks)
  layout/       Container, Section, Header, Navigation, Footer, SkipToContent, Shell
  commerce/     ProductCard, ProductGrid, ProductFilters, ProductImage, ProductPricing,
                ProductGallery, ProductMeta, ProductInfo, AddToCartButton, CartTable,
                CartSummary, CartProvider (+ Skeleton loading states) — MiniCart still
                deferred; CheckoutForm/CheckoutOrderSummary are colocated under
                app/checkout/ instead, not here — single consumer, see docs/decisions.md,
                "Checkout"
  music/        player, track list, waveform UI — created on first use
  marketing/    Hero, ShopByType — landing/promo sections
  common/       shared, feature-agnostic UI (e.g. Logo, Breadcrumbs)
lib/
  apollo/       Apollo Client setup — client + provider (browser), rsc-client (server),
                cart-client + session-link (cart/checkout, session-scoped), links
  actions/      Server Actions — cart.actions.ts and checkout.actions.ts, the only
                callers of cart.service.ts's/checkout.service.ts's mutating functions
  env.ts        typed environment access
  config/       centralized app configuration — store.ts, routes.ts, theme.ts
  format-money.ts  Money -> display string, shared by presentation mappers
  parse-money.ts   the inverse — WooCommerce price string -> Money, shared by every
                    mapper (product/cart/checkout)
  product-filters.ts  searchParams <-> ProductsQueryWhere translation, shared by
                       every Listing page (app/products, app/search, app/categories/[slug])
  cart-session.ts  the httpOnly WooCommerce session-cookie helper (feature/cart;
                    feature/checkout added clearCartSessionToken)
  checkout-validation.ts  required-field/email/country validation WooCommerce's own
                          `checkout` mutation doesn't enforce — see docs/decisions.md,
                          "Checkout"
graphql/
  queries/      GraphQL queries (e.g. site-info.ts, products.query.ts, product.query.ts,
                cart.query.ts, checkout.query.ts)
  mutations/    cart.mutations.ts, checkout.mutations.ts
  fragments/    GraphQL fragments (e.g. product.fragment.ts)
services/       the only callers of Apollo Client; UI's data contract
  mappers/      WooCommerce DTO -> domain type transformations
hooks/          shared React hooks — use-cart.ts (feature/cart), the first file here
types/          shared TypeScript types (e.g. MusicProduct, Cart, Order)
  dto/          types mirroring WPGraphQL responses (e.g. WooCommerceProductDto,
                WooCommerceCartDto, WooCommerceCheckoutPayloadDto)
data/           static content (e.g. product-types.ts, sort-options.ts, countries.ts) —
                distinct from lib/config — see component-principles.md
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

No commerce, search, or account UI exists in `Navigation` yet — see
[decisions.md](decisions.md) for why that's a scope decision, not an
oversight. Cart is the first exception (`feature/cart`): a plain utility
link to `/cart` rendered in `Header`, deliberately kept separate from
`Navigation`'s catalog-only list — see "Cart" above.
