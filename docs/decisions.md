# Architectural decisions

## Headless WordPress

WooCommerce is the most mature open-source commerce data model available
(products, variants, inventory, tax, orders) and the client's team can
manage catalog and orders through the WordPress admin they already know.
Headless removes WordPress's PHP templating from the request path entirely
— it becomes a data and admin backend only, reachable exclusively through
GraphQL.

## WooCommerce

Chosen over a hosted commerce API (Shopify, etc.) because the client wants
to own the data and hosting, and because WPGraphQL for WooCommerce exposes
the full commerce model (products, cart, checkout) as GraphQL without
custom backend development.

## Next.js (App Router)

Server Components let product/catalog pages be rendered and cached on the
server without shipping a client-side data-fetching waterfall, while
Client Components handle the genuinely interactive parts (cart, audio
player, search). App Router is the actively developed Next.js routing
model and is what the installed Next.js version (16.x) targets.

## GraphQL

WPGraphQL gives a single typed schema over WordPress + WooCommerce instead
of stitching together the WP REST API and WooCommerce REST API separately.
One endpoint, one query language, one client.

## Apollo Client

Normalized caching means fetching a product on a listing page and again on
its detail page doesn't issue two network requests — the cache reconciles
them. `@apollo/client-integration-nextjs` (`ApolloNextAppProvider`) is
Apollo's own App Router integration: it solves per-request client creation
on the server (see below) instead of us hand-rolling it.

## shadcn/ui and Radix UI

Radix supplies accessible, unstyled interaction primitives (dialogs,
dropdowns, popovers) — correct keyboard/focus/ARIA behavior without
building it from scratch. shadcn/ui generates styled components from
those primitives directly into `components/ui/`, so they're owned,
readable, and editable source in this repo rather than an opaque
dependency, which matters for a design that will diverge from defaults.

## Why services sit between components and Apollo Client

```
React Components
      │
      ▼
   Services
      │
      ▼
Apollo Client
      │
      ▼
   GraphQL
      │
      ▼
 WordPress
```

Components are not allowed to call `useQuery`/`useMutation` or import from
`graphql/` directly. Reasons:

1. **One place to change when the schema changes.** WPGraphQL's shape is
   WooCommerce's shape, not necessarily the shape a component wants. A
   service function returns domain data (`Product`, not a raw GraphQL
   response); a schema change means editing the service, not every
   component that displayed that data.
2. **Testability.** Services are plain async functions — testable without
   rendering React or mocking Apollo's provider tree.
3. **No duplicated queries.** When query logic lives in components, the
   same data ends up fetched slightly differently in three places. A
   service is the one place a given piece of data is fetched from.
4. **Enforceable boundary.** "GraphQL knowledge lives in `graphql/` and
   `services/`" is a rule that's easy to review for, once it's the only
   path components have to reach data.

The cost is an extra function call per data need. For a storefront this
size, that's a small, worthwhile price for keeping ~100+ future components
from each knowing what a GraphQL endpoint is.

## Client creation: factory, not a naive global singleton

The Apollo setup (`lib/apollo/`) uses a `createApolloClient()` factory
passed to `ApolloNextAppProvider`, rather than a single module-level
`export const client = new ApolloClient(...)`.

A literal module-level singleton is unsafe with the App Router: Next.js's
server keeps one Node process alive across many users' requests, so a
truly global client would share its cache across everyone hitting the
server concurrently — one user's private cache state (or a future
authenticated request) leaking into another's response. `ApolloNextAppProvider`
creates a fresh client per server request and reuses one true singleton in
the browser after hydration, which is what "singleton" should mean here.

## First GraphQL integration: `generalSettings` as a connectivity check

The first real query added to the project (`graphql/queries/site-info.ts`)
deliberately fetches something trivial — WordPress's `generalSettings`
(title, description, URL) — rather than anything product-related. The goal
was narrow: prove the full chain works before building on top of it.

```
Browser
   │  requests a route
   ▼
Next.js (App Router, Server Component)
   │  renders app/dev/graphql/page.tsx, calls a service function
   ▼
Apollo Client
   │  lib/apollo/rsc-client.ts — a client scoped to this request
   │  (registerApolloClient, not ApolloNextAppProvider — see above)
   ▼
Service Layer
   │  services/site.service.ts — the only caller of Apollo's `query()`
   ▼
WPGraphQL
   │  resolves generalSettings against WordPress's own data
   ▼
WordPress
```

`app/dev/graphql/page.tsx` proved this end-to-end against the live backend
(`http://tss.maabara.local/graphql`) — confirmed reachable via a direct
`curl` to the endpoint and via the rendered page, both returning the site's
actual title and URL. It's a temporary route, not linked from anywhere,
meant to be deleted once real pages exercise the same path.

**Why the service layer, not the component, fetches the data:** the page
component (`app/dev/graphql/page.tsx`) has zero GraphQL awareness — it
imports `getSiteInfo()` and gets back a plain `{ title, description, url }`
object. It doesn't know a query executed, what `generalSettings` is, or
that Apollo exists. This is the same boundary described above for
`services/product.service.ts`: components consume domain data, and only
`services/*.service.ts` files are allowed to know GraphQL is involved. That
boundary is what let this page be written as a plain `async` Server
Component with ordinary `try`/`catch` — no `useQuery`, no loading/error
state management in the component, no client-side JavaScript for a page
that has no interactivity.

**Server Component, not Client Component:** this query needs to run once
per request and render server-side HTML — there's no interactivity to
justify shipping it to the browser. That's why it uses
`lib/apollo/rsc-client.ts` (`registerApolloClient`) rather than the
`ApolloProvider`/`useQuery` path meant for Client Components. Both paths
now exist in `lib/apollo/` because they solve genuinely different problems
(per-request server data vs. browser-interactive data), not because of
duplication — see the "factory, not a naive global singleton" section
above for why a single client can't safely serve both.

## Product domain model refinement: categories, DTO layer, ProductType

A follow-up pass on `MusicProduct` (see [product-model.md](product-model.md)
for the full model) made three decisions worth recording.

**`category: TaxonomyTerm` became `categories: TaxonomyTerm[]`.** The
canonical model had modeled a single primary category, on the assumption
that one category is enough for navigation. WooCommerce natively supports
multiple categories per product, and a domain model that's *more*
restrictive than the backend it's sourced from is a bug waiting to happen
— the first product with two categories would have nowhere for the second
one to go. The fix removes a constraint the business domain never actually
had; it was an implementation shortcut, not a modeling decision.

**A DTO layer is now planned between the GraphQL response and the mapper.**
Originally the plan was WPGraphQL response straight into the mapper. Adding
an explicit WooCommerce DTO stage — a type that mirrors a specific query's
result shape exactly, before any transformation — means the mapper's input
is fully typed against something real (compile-time breakage instead of
runtime `undefined`s when a query changes), the mapper stays a pure,
independently-testable function, and WooCommerce's representation quirks
(connection wrappers, string-formatted prices, per-field nullability) have
exactly one place to be absorbed. See
[product-model.md](product-model.md#dto-layer) and
[architecture.md](architecture.md#graphql-flow) for the full pipeline and
reasoning. No DTO type exists yet — there's still no query to type it
against — but the mapper's documentation now reflects this as the intended
shape rather than a direct response-to-domain transform.

**`ProductType` stays a string union, not a TS `enum` — confirmed, not
just carried over by default.** Two reasons beyond general TS style
preference: it's the type a GraphQL string value already satisfies with no
conversion step, and this project's `tsconfig.json` has
`isolatedModules: true`, which specifically rules out `const enum` (it
needs whole-program knowledge to inline, incompatible with file-by-file
transpilation). A regular `enum` remains technically possible but buys
nothing a union doesn't already provide, at the cost of a runtime object
and an import everywhere the type is used. This is revisited if
`productType` ever needs attached runtime data per variant (a
`Record<ProductType, T>` map is the more likely fix) or if WPGraphQL
exposes it as a real GraphQL enum and a future codegen tool emits TS enums
for it.

## Schema investigation: the real WPGraphQL schema, and the first DTO

Before writing the first real WooCommerce DTO, the live WPGraphQL schema
was inspected directly rather than assumed from WooCommerce/WPGraphQL
documentation or prior experience with other WooCommerce sites — schemas
vary by plugin version and store configuration, and this project's
`AGENTS.md` already warns against assuming familiar behavior without
checking. Two methods were used together: temporarily enabling public
GraphQL introspection (`wp eval 'update_option("graphql_general_settings",
array("public_introspection_enabled" => "on"));'`, reverted immediately
after via `delete_option`, restoring the exact prior state — introspection
is off by default and was left off) to query the schema directly, and live
test queries against the real endpoint to confirm actual behavior (e.g.
that connections return `nodes: []`, not `null`, when empty).

**What the schema actually looks like, confirmed by introspection:**

- `Product` is a GraphQL **interface**, implemented by four concrete
  types: `SimpleProduct`, `VariableProduct`, `ExternalProduct`,
  `GroupProduct`. Pricing fields (`price`, `regularPrice`, `salePrice`)
  exist on each concrete type individually — **not** on the shared
  `Product` interface. Any query needs an inline fragment (`... on
  SimpleProduct { regularPrice }`) or to target a concrete type directly.
- Root query exposes `product(id)` / `products(...)` for fetching, plus
  parallel root fields for every taxonomy (`productCategories`,
  `productTags`, `productBrands`, `productTypes`, `productAttributes`).
- Images: `image: MediaItem` is WooCommerce's own direct product-image
  field (simpler than the generic WordPress `featuredImage` connection
  edge, which also exists). `galleryImages` is a `{ nodes: MediaItem[] }`
  connection. `MediaItem.sourceUrl` / `.altText` / `.mediaDetails.width`
  `.height` cover what `ProductImage` needs.
- Categories (`productCategories`) and tags (`productTags`) are both real
  `{ nodes: [...] }` connections, confirming the earlier decision to model
  `categories` as an array was correct — multiple categories per product
  is exactly how the schema represents it. Categories are hierarchical
  (`parent`/`children`/`ancestors`); tags are flat.
- A **`ProductBrand` taxonomy already exists** in the schema
  (`productBrands`) — WooCommerce's own Brand feature, registered and
  queryable today, currently empty of terms in this store. Not wired into
  the model this pass (out of scope — this task investigated `productType`,
  not `producer`), but it's a stronger `producer` candidate than the
  "likely a custom taxonomy" assumption in [product-model.md](product-model.md)
  — worth revisiting when `producer` mapping is next in scope.
- `SimpleProduct.downloads` (WooCommerce's native downloadable-files list)
  exposes `fileExt`/`fileType`/`name`/`file` per file — a real,
  no-custom-field path to `fileFormat`, correcting the earlier assumption
  that it would need custom meta.
- `averageRating`, `reviewCount`, and `totalSales` are real native fields
  on every product type — correcting the earlier Future Extensions
  assumption that Rating/Review Count/Download Count would need custom
  backend aggregation. They don't; they're already there.
- No ACF or similar plugin is installed, and no custom taxonomies beyond
  WooCommerce's own (category, tag, brand, shipping class) exist. `bpm`,
  `musicalKey`, `previewUrl`, `duration`, and `genres` genuinely have no
  schema field yet, confirming (not just assuming) that prior part of the
  model's documentation.
- The store currently has zero products — findings above are schema-level
  (introspection), not inferred from sample data, since none exists yet.

**`productType`'s source, decided:** a WooCommerce **Global Product
Attribute** (e.g. one named "Product Type" with the six values as options),
configured through the WooCommerce admin UI. Ruled out:

- **Product Category** — already carrying navigation duty; overloading it
  with a second, unrelated closed-set concern (six specific values, one
  per product) risks the same ambiguity already flagged between
  `categories` and `genres`.
- **WooCommerce's built-in product type** (`ProductTypesEnum`, and the
  `ProductType`/`productTypes` root fields) — confirmed via introspection
  and a live query that this represents `simple` / `variable` / `external`
  / `grouped` / `variation`: WooCommerce's own structural classification
  of how a product handles pricing and variations. It is not a taxonomy —
  querying `productTypes { nodes { name slug } }` returns exactly those
  five fixed structural values, confirming it has nothing to do with music
  content classification. Same name, unrelated concept — noted explicitly
  so it isn't confused for a shortcut later.
- **A meta field** (`MetaData { key value }` on every product) — technically
  works and needs no admin UI changes, but stores an untyped string with no
  enforced closed set (typos like "Sample pack" vs "sample-pack" become
  silent bugs) and still requires custom PHP to register the meta key for
  GraphQL exposure — no less backend work than an attribute, for a weaker
  result.
- **A custom taxonomy** — would end up structurally identical to a Global
  Attribute (WooCommerce attributes are implemented as taxonomies,
  `pa_{slug}`, under the hood) but requires hand-written registration code
  to get what a Global Attribute provides out of the box through the
  WooCommerce admin UI. No reason to build it by hand.

Not implemented this pass — no attribute has been created in WooCommerce
yet, and this task's scope was investigation and the DTO/domain model, not
backend configuration or queries.

**The first DTO (`types/dto/woocommerce-product.dto.ts`) is scoped to
`SimpleProduct` only**, not a union covering all four `Product`-implementing
types. A digital sample-pack marketplace's individual products are
expected to be simple products — no variations, not external listings, not
product groups — so modeling `VariableProduct`/`ExternalProduct`/
`GroupProduct` now would be speculative coverage for a case with no
evidence it's needed. If that assumption turns out wrong, the fix is
additive: another DTO type alongside this one, not a rewrite.

The DTO's field list itself is deliberately narrower than the full schema
this investigation uncovered — it includes only what a current
`MusicProduct` field needs (plus `databaseId`, cheap and universally
useful). Real, confirmed-available fields with no current `MusicProduct`
counterpart (`averageRating`, `reviewCount`, `totalSales`, `downloads`,
`productBrands`, `metaData`) are documented above and in
[product-model.md](product-model.md) rather than added to the DTO
speculatively — keeping the first DTO lean and fully justified by what the
mapper actually needs to produce today.

## First real product query: placeholders over widening the domain type

Implementing the real mapper (`services/mappers/product.mapper.ts`) forced
a decision the investigation pass could only flag, not resolve:
`productType` and `producer` are required `MusicProduct` fields with no
WooCommerce source at all yet. Two options existed — widen both to
nullable (matching the pattern used for `artwork`, below), or map every
product to a fixed, obviously-fake placeholder value. Placeholders were
chosen, deliberately not the nullable pattern, because the two situations
are different: a product having no image is a normal, permanent state for
real catalog data, whereas "no productType" or "no producer" would never
be true for a real, complete product on this marketplace — it's a
temporary gap in what the backend exposes today, not a fact about the
business domain. Widening the type to make room for that gap would
misrepresent a backend limitation as a domain characteristic, and every
future consumer of `MusicProduct` would have to handle `productType: null`
forever, even after a Global Product Attribute makes it always available.
`UNRESOLVED_PRODUCT_TYPE`/`UNRESOLVED_PRODUCER` in `product.mapper.ts` are
that decision made explicit and centralized to one place to update later.

**`artwork` did get widened** (`ProductImage` → `ProductImage | null`) for
the opposite reason: a product permanently having no photo is a real,
ordinary state, not a gap waiting to be filled by backend work. Same
category of problem — a required field the mapper couldn't always
populate — opposite fix, because the underlying reality is different. See
[product-model.md](product-model.md) for where this is flagged for anyone
reading the model.

**Verification used a real product, not just the empty-catalog case.**
The store has no real products yet, so a temporary one was created via
`wp wc product create` (name, price, sale price, a category, a tag, a
featured image), fetched through `/dev/products`, confirmed to render
correctly, then deleted along with the category/tag terms it required —
the store was left exactly as found. This is what surfaced two facts that
were previously assumptions: `regularPrice`/`salePrice` come back as
formatted strings *with a currency symbol* (`"$29.99"`, not `"29.99"`),
confirming the mapper's defensive stripping is necessary rather than
paranoid; and no field in the entire schema exposes store currency
(confirmed by searching every type's fields, not just the fields on
`Product`) — the only `currency` field anywhere is `Order.currency`. The
mapper hardcodes `"USD"` until a real source exists; see
[docs/api/product-query.md](api/product-query.md) for the full list of
fields retrieved and why.

**Filtering non-`SimpleProduct` nodes happens in `product.service.ts`, not
the mapper.** `products.nodes` is typed `[Product!]!` — the shared
interface — so a node that's actually a `VariableProduct` (or any other
concrete type) would come back missing nearly every field this query
selects, since the `... on SimpleProduct` inline fragment contributes
nothing to it. The mapper stays a pure, single-item `WooCommerceProductDto
-> MusicProduct` transform per this task's requirement; deciding which raw
nodes are even safe to treat as a `WooCommerceProductDto` is a
collection-level concern, so it belongs in the service function that
already owns the array.

## Centralized configuration: `lib/config`

`lib/config/` (`store.ts`, `routes.ts`, `theme.ts`) implements a folder
that had been documented as planned since the architecture review but had
no content until this pass. A few decisions worth recording.

**`StoreConfig` is an exported interface, `storeConfig` a separate
exported instance of it.** The stated goal was supporting future Maabara
storefronts beyond TSS, not just TSS itself. Exporting the shape
separately from the data means a second storefront can define its own
object typed against `StoreConfig` rather than this file accumulating
`if (store === "tss")` branches — the extensibility is in the type being
reusable, not in any multi-tenancy logic actually being built yet (none
was — that would be speculative for a branch with exactly one storefront
to configure).

**`theme.ts` deliberately excludes color, radius, shadow, and icon
tokens**, despite `docs/design-system.md` documenting all of them. Those
are already implemented as CSS custom properties in `app/globals.css` and
consumed through Tailwind utility classes (`bg-background`, `rounded-xl`)
— exposing them again as TypeScript constants would be the exact
duplication the task asked to avoid. What's in `theme.ts` is either
consumed outside Tailwind's class-based styling (aspect ratios used in
layout math, animation durations passed to a motion library) or doesn't
have a Tailwind utility of its own (grid column defaults, header height).

**Every numeric value in `theme.ts` cites the design-system.md section it
came from — none were invented independently.** Two gaps surfaced in the
process: `docs/design-system.md` didn't yet define header height, footer
spacing, or a z-index scale, despite the task asking `theme.ts` to expose
them. Per that document's own stated rule ("if this document doesn't have
the token a component needs, that's a gap in this document to fix, not a
license to improvise"), those three were added to design-system.md first,
then encoded in `theme.ts` — not invented directly in code with no
documented source. Where design-system.md gives a *range* rather than a
single value (e.g. container padding "48–64px" on desktop), the lower
bound was used consistently as the canonical value, rather than picking
different rounding rules per token.

**`UNRESOLVED_PRODUCT_TYPE` and `UNRESOLVED_PRODUCER`
(`services/mappers/product.mapper.ts`) were deliberately left out of
`lib/config`.** They look like configuration (constants set once, read
elsewhere) but aren't: per the ADR above ("First real product query:
placeholders over widening the domain type"), they represent a temporary
absence of real WooCommerce data, not a business setting anyone would
configure. Moving them to `lib/config` would relabel a data gap as a
configuration choice. `FALLBACK_CURRENCY` in the same file, by contrast,
*was* moved (it now reads `storeConfig.currency.code`) — a store's
currency genuinely is configuration, even though today it's a fallback
for the same underlying reason (no schema field exposes it yet).

**Only two hardcoded values existed to migrate**, found by searching the
codebase rather than assumed: `DEFAULT_PAGE_SIZE` in
`services/product.service.ts` (now `storeConfig.catalog.productsPerPage`)
and `FALLBACK_CURRENCY` in the mapper (now `storeConfig.currency.code`).
No hardcoded route strings existed to migrate `routes.ts` into — no page
other than the untouched create-next-app homepage and the `/dev/*`
diagnostic routes exists yet, so `routes.ts` currently has no call sites.
That's expected for infrastructure landing ahead of the UI that will
consume it, not a sign it was unnecessary.
