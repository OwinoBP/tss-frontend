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

## Layout foundation: consuming theme.ts values as real responsive CSS

Building `Container` and `Section` (`components/layout/`) surfaced a
Tailwind v4 constraint the config-layer branch hadn't hit yet:
`containerPadding`/`sectionSpacing` in `lib/config/theme.ts` are
responsive (a different number per breakpoint), and Tailwind's compiler
statically scans source files for class name *text* — it can't see the
result of `` `px-[${containerPadding.desktop}px]` ``, so a dynamically
interpolated arbitrary-value class silently generates no CSS at all.

**Resolved with Tailwind v4's custom-property shorthand
(`px-(--container-padding-desktop)`), not by hardcoding the numbers as
plain Tailwind classes.** The className strings are static (Tailwind can
see `--container-padding-desktop` as literal text), while the *value* of
that CSS variable is set via inline `style`, computed from theme.ts at
render time — so theme.ts stays the single source of truth, verified by
inspecting the actual compiled CSS output (`.px-\(--container-padding-mobile\){padding-inline:var(--container-padding-mobile)}`
inside the correct `@media` blocks), not assumed to work. `card.tsx`
already uses this exact pattern (`py-(--card-spacing)`) — this wasn't a
new technique introduced for this branch, just the first time it was
needed for a value that comes from `lib/config` rather than a
component's own local state.

The shared logic (building the four-breakpoint CSS-variable object) was
extracted to `toResponsiveVars` in `lib/utils.ts` rather than duplicated
between `Container`, `Section`, and `Footer` — three consumers crossed the
threshold docs/component-principles.md sets for "shared, not colocated."

**Non-responsive theme.ts values (`Header`'s height, `SkipToContent`'s
z-index) use a plain inline `style` instead** — no custom-property
indirection needed, since there's no per-breakpoint variation to express
and no Tailwind involvement at all for those two properties.

## Navigation scope: primary catalog links only

`Navigation` renders only the primary (catalog) links —
Products/Categories/Product Types/Producers/About/Contact — not the
utility-nav items (search, cart, account) docs/design-system.md's
Navigation Principles describes as a second tier. `routes.ts` defines
paths for all of them, but search, cart, checkout, and account are
explicitly out of this branch's scope; a nav item linking to `/cart` would
mean shipping a stub link to a feature that doesn't exist, which reads as
commerce UI, not "establishing the navigation API." Utility nav items can
be added to `Navigation` (or a sibling component) once those features
actually exist.

## Fixing three pre-existing double-`<main>` landmarks

Wiring `Shell` into `app/layout.tsx` gives every page one `<main
id="main-content">` landmark, matching `SkipToContent`'s target. Three
existing pages already rendered their own `<main>` internally — the
untouched create-next-app homepage (`app/page.tsx`) and both `/dev/*`
diagnostic pages — which would have nested a second `<main>` inside the
Shell's, an invalid, `axe`-flagged landmark structure. Each was changed
from `<main>` to `<div>` with no other change — a direct, mechanical
consequence of introducing the Shell, not a redesign of any of those
pages' content, and within scope even for the untouched homepage (`app/page.tsx`
still displays the identical create-next-app boilerplate content — only
its outermost tag changed).

## Homepage: editorial shell only, no ProductCard dependency

`feature/homepage` is the first branch in the post-Milestone-1 roadmap,
ahead of `feature/product-card` and `feature/product-grid`. Scope was
confirmed before implementation rather than assumed: the homepage renders
two `components/marketing/` sections — `Hero` and `ShopByType` — with no
live WooCommerce product data and no dependency on `ProductCard`, which
doesn't exist yet. A "featured products" section is deferred to whichever
branch first has a real card component to render, rather than building a
one-off inline product preview here that `ProductCard` would immediately
duplicate or replace.

**`Hero`** renders the page's one H1 from `storeConfig.identity.tagline`
(written for customer-facing use) — deliberately not
`identity.description`, which names "headless WooCommerce" and is written
for internal/SEO use, not a storefront visitor. Above it, a small
catalog-scope line enumerates the six `ProductType` values
(types/music-product.ts) verbatim rather than inventing brand copy —
factual and already-decided content, not a marketing claim needing
client sign-off. Two CTAs (`routes.products.index`, `routes.productTypes.index`)
point at routes that have no page yet, consistent with `Navigation`'s
existing precedent of linking ahead of the pages that will serve them
(see "Navigation scope" above).

**`ShopByType`** is a text-only grid of the same six `ProductType` values,
each linking via `routes.productTypes.detailPath(slug)` — the first real
caller of that route builder. Display labels are colocated as a local
const in the component file rather than extracted to `data/`, following
`Navigation`'s own `DEFAULT_ITEMS` precedent: a list with exactly one
consumer today doesn't earn a shared location yet.

**Two pre-existing gaps were fixed while wiring this up, not worked
around:**

1. `app/globals.css`'s `@theme inline` block defined `--font-sans: var(--font-sans)`
   — a self-reference flagged in docs/design-system.md as a known wiring
   gap "for whoever implements this system" to fix. Implementing the
   first real typography (`Hero`'s H1) was that moment; changed to
   `var(--font-geist-sans)`, matching how `--font-mono` was already wired.
2. `app/layout.tsx`'s `metadata` still had create-next-app's literal
   `"Create Next App"` title/description. Replaced with
   `storeConfig.identity.name` / `storeConfig.seo.titleTemplate` /
   `storeConfig.seo.defaultDescription` — config that already existed
   for exactly this purpose but had no caller yet.

**A third issue was a real bug, not a pre-existing known gap: `Section`'s
`heading` prop rendered outside any `Container`.** `Section` (introduced
in the layout-foundation branch) had no prior consumer of `heading` — a
grep across the whole codebase before this branch confirmed zero call
sites. Passing `heading="Shop by Type"` alongside a caller-supplied
`Container` wrapping only `children` left the heading flush against the
viewport edge with no horizontal padding at all, confirmed visually
(screenshot showed the H2 starting at `x=0` while the grid below it,
inside `Container`, was correctly inset) before being fixed. This wasn't
a bug specific to how `ShopByType` used `Section` — `heading` had no
`Container` of its own to opt into regardless of caller, so it was
unconditionally broken for any future consumer.

**Fixed by making `Section` own a `Container` internally** (new
`containerVariant` prop, default `"content"`) wrapping both `heading` and
`children` together, rather than leaving containment to the caller. This
is a fix at the source, not a per-consumer workaround: `Hero` and
`ShopByType` both dropped the `Container` they had been wrapping their
own children in, now relying on `Section`'s. Same reasoning as the
`toResponsiveVars` extraction in the layout-foundation branch — fix
shared layout infrastructure at first real use rather than let every
future `Section` consumer either duplicate the heading's container or
rediscover the same misalignment.

## ProductCard: a presentation model between MusicProduct and the component

`feature/product-card` is the first `components/commerce/` component and
the first component built specifically for reuse across many future pages
(grids, carousels, related-product rails) rather than for one page. That
reuse requirement is what drove the main structural decision: `ProductCard`
never receives a `MusicProduct` — it receives `ProductCardProps`, produced
by a new pure mapper:

```
MusicProduct -> toProductCard() -> ProductCardProps -> ProductCard
```

This mirrors the DTO -> domain mapper shape already established for the
data layer (`services/mappers/product.mapper.ts`), one stage further down
the pipeline described in docs/architecture.md and
docs/component-principles.md ("Components consume canonical domain models
only"). Concretely, this is what a `MusicProduct -> ProductCardProps`
step buys over passing `MusicProduct` straight into the component:

- **`ProductCard` only imports what it renders.** `MusicProduct` carries
  `bpm`, `musicalKey`, `fileFormat`, `duration`, `previewUrl`,
  `categories`, `genres`, `tags`, `releaseDate` — none of which this card
  displays. A component typed against the full domain model can reach for
  any of those later without a compiler error, which is exactly the kind
  of silent scope creep a narrower prop type prevents.
- **Formatting happens once, in a pure function.** `price.regular` /
  `price.sale` are already `Intl.NumberFormat`-rendered strings
  (`"$29.99"`) by the time `ProductCard` sees them — the component does no
  currency math, and `toProductCard` is trivially unit-testable with a
  plain `MusicProduct` fixture, no rendering involved.
- **The component stays genuinely reusable.** Anything that can produce a
  `ProductCardProps` can render a `ProductCard` — a future wishlist page,
  a "related products" rail sourced differently than the main catalog
  query, or a Storybook fixture — without any of them needing to know
  `MusicProduct`'s full shape or `toProductCard`'s existence at all.

**`product-card.mapper.ts` is colocated inside
`components/commerce/ProductCard/`, not under `services/mappers/`.** The
existing `services/mappers/` holds WooCommerce-DTO -> domain mappers —
mappers with GraphQL/WooCommerce knowledge, owned by the service layer.
`toProductCard` has none of that; it's domain model -> presentation model,
a concern that belongs to the component that consumes its output, not to
the data-fetching layer. Keeping it in the component's own folder also
means the component and the shape it depends on can't drift apart
silently in two different parts of the tree.

**Two label maps for `ProductType`, not one shared and pluralized.**
`components/marketing/ShopByType` already has its own plural labels
("Sample Packs", for a category-browsing tile). `product-card.mapper.ts`
defines a separate singular map ("Sample Pack", for a single item) rather
than deriving one from the other by string concatenation. These are
different content for different contexts that happen to share the same
six `ProductType` slugs — not the same value duplicated, so this isn't
the "colocate what's private, extract what's shared" case from
docs/component-principles.md; sharing one map and mechanically
pluralizing would have been the more "clever" option, not the more
correct one.

**Product type renders as plain Caption-style text, not the `Badge`
pill component.** docs/design-system.md's "Product card anatomy" table
lists two separate rows: "Product type" (Caption style — plain metadata
text) and "Badges" (a `Badge` pill, reserved for *derived* flags —
`featured`, `salePrice !== null`). The task brief's "product type
badge/label" phrasing could read either way; design-system.md's own
table is the more specific, more authoritative source, so product type
is rendered as text (`text-xs font-medium text-muted-foreground`), and
`Badge` is left unused here — there's no `featured`/sale badge in this
pass since it wasn't asked for, and adding one would be scope beyond
what this branch's brief specified.

**Metadata stacking order (title, producer, type, then price) comes
directly from design-system.md's own spacing section**, not a layout
guess: "Gap between stacked metadata lines (title/producer/type)... Gap
before price: sm (12px)" explicitly lists that order and distinguishes
the tight intra-group gap from the larger pre-price gap. Implemented as
`gap-1` (4px) within the title/producer/type block and `mt-3` (12px)
before the price row.

**Artwork placeholder: a quiet `--muted` fill with a small decorative
icon, never a fake image.** `ProductCardArtwork` is `null` when
`MusicProduct.artwork` is `null` — no default/stock image URL exists
anywhere in this component, matching the task brief's "no placeholder
images, no fake artwork" and design-system.md's own guidance ("a quiet
placeholder fill using `--muted`, not a broken-image icon"). A small
`lucide-react` `Music2` glyph is centered in the fill for a slightly
more finished empty state than a bare gray square; it's `aria-hidden`
since the card's accessible name already comes from its visible text.

**The whole card is one `next/link`, not multiple nested links.** A
common alternative pattern links the image and title separately; that
creates duplicate tab stops for what's functionally one destination and
risks an ambiguous accessible name. Wrapping the entire `Card` in a
single `Link` gives one tab stop whose accessible name is its full text
content (image alt + title + producer + type + price) — verified via a
keyboard-navigation check (`Tab` lands on one `<a>` whose `href` is the
mapped `routes.products.detailPath(slug)` and whose text content
includes all four visible fields) rather than assumed.

**`next.config.ts` now derives an `images.remotePatterns` entry from
`NEXT_PUBLIC_GRAPHQL_ENDPOINT`.** `next/image` (used for real artwork)
refuses to load from any host not explicitly allow-listed, and product
artwork is served by the same WordPress backend GraphQL already reads
from — so the allowed host is parsed from the existing endpoint URL
rather than adding a second hardcoded domain. Wrapped in a `try`/`catch`
returning no remote patterns on a missing or malformed URL rather than
throwing: `lib/env.ts` is where that variable's presence is meant to be
validated for the running app, not `next.config.ts`, which runs before
any of that and shouldn't hard-crash a build over it.

**Verified visually, not just by type/lint checks.** `app/dev/product-card`
(temporary, unlinked — same convention as `app/dev/products`) renders
`ProductCard` against three fixture `MusicProduct` objects (real artwork,
real artwork + sale price, `artwork: null`) run through the actual
`toProductCard` mapper. Screenshotted via a headless-Chromium script to
confirm: artwork sits flush against the card's rounded top corners with
no fake images, the null-artwork placeholder renders as a quiet muted
fill, a long title truncates to two lines, sale pricing shows a
struck-through regular price beside the sale price, and keyboard `Tab`
reaches one focusable link per card with a visible focus ring matching
the card's rounded shape.

## ProductGrid: stays dumb on purpose, and a `toResponsiveVars` limit found by testing

`feature/product-grid` adds `components/commerce/ProductGrid` — a single
component that arranges `ProductCardProps[]` into a responsive grid. Two
decisions worth recording.

**`ProductGrid` takes `ProductCardProps[]`, not `MusicProduct[]`.** The
alternative — accepting `MusicProduct[]` and calling `toProductCard`
internally — would make call sites slightly shorter, but it would also
give `ProductGrid` a dependency on the domain model it doesn't need to
have. As written, `ProductGrid` only knows "arrange `ProductCardProps`
into a grid"; it stays composable with anything that already produces
that shape, and every real consumer (`feature/product-catalog`, a future
producer page, a future "related products" rail) calls
`products.map(toProductCard)` once at its own call site instead. Keyed by
`product.href` (unique per product, already present on the prop) rather
than adding an `id` field to `ProductCardProps` just for this — that
would widen the card's props with a field it doesn't render, which is
exactly what `ProductCardProps` was introduced to avoid (see the
ProductCard ADR above).

**No loading state, no empty state, no pagination — deliberately.**
`ProductGrid` renders nothing for an empty array and has no opinion about
what "no results" should look like; both are page-level concerns
(`feature/product-catalog` owns fetching, filters, and empty/error UX).
Building either into the grid now would be building ahead of a real
requirement for how that page wants to present it.

**A second, real bug found by inspecting compiled CSS rather than
assuming the established pattern would extend cleanly.** The first
attempt wired `productGridDefaults.columns` through the same
`toResponsiveVars` + `grid-cols-(--var)` custom-property technique
already proven for padding/gap (`Container`/`Section`/`Footer`). It
compiles without error, but `grid-template-columns` needs a full track
list (`repeat(N, minmax(0, 1fr))`); substituting a bare `var(--x)` that
resolves to a plain number (`1`, `2`...) is syntactically-valid-looking
but semantically invalid CSS, silently dropped by the browser. Caught by
grepping the actual compiled stylesheet before shipping it, per this
project's standing practice of verifying generated CSS rather than
assuming a pattern transfers (see the layout-foundation ADR above).
Fixed by reverting to the technique `ShopByType` already uses for its own
responsive column counts — literal Tailwind classes
(`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`) — with a
comment tying the numbers back to `productGridDefaults.columns` as their
source of truth, since Tailwind can't statically see a class name built
from a config value regardless of technique. Gutter still uses
`toResponsiveVars` correctly: `gap` accepts a plain length, so
`gap: var(--product-grid-gutter-mobile)` (resolving to `16px`) is valid
where `grid-template-columns: var(--product-grid-columns-mobile)`
(resolving to `1`) is not — confirmed by inspecting both in the compiled
output.

**Verified visually across all four responsive tiers**, not just at one
viewport: `app/dev/product-grid` (temporary, unlinked, same convention as
the other `app/dev/*` pages) renders eight fixture products — a mix of
real artwork, `artwork: null`, and sale pricing — through
`toProductCard`. Screenshotted at mobile/tablet/desktop/large-desktop
widths, confirming 1/2/3/4 columns and 16px/16px/24px/24px gutters
matching `productGridDefaults` exactly, with no console errors at any
tier.

## Product Catalog: the reusable listing pattern, pagination, loading, and error boundaries

`feature/product-catalog` adds `app/products` — the first real,
permanently-linked page in the app (`routes.products.index` and
`Navigation`/`Hero` already pointed here with nothing behind it; see the
homepage and ProductCard ADRs above). It's deliberately treated as the
template every future listing page (category, brand, search, sale
collection, related products) will copy, not a one-off: service ->
presentation mapper -> `ProductGrid`, plus the three states a real listing
needs — loading, empty, error — each handled by the mechanism that's
actually correct for it, not one catch-all.

**`getProductsPage` is additive, not a breaking change to `getProducts`.**
The existing `getProducts(): Promise<MusicProduct[]>` had exactly one
caller (`app/dev/products`, now deleted — see below) and a documented
contract of "just the array." Rather than widen its return type (which
would have forced every future simple caller — a homepage "featured
products" rail, a producer page — to unwrap `.products` even when it
never needs `pageInfo`), a new `getProductsPage` returns
`{ products, pageInfo }`, and `getProducts` becomes a one-line wrapper
around it. One function still does the actual fetching; two call shapes
for two different needs.

**Loading, empty, and error are three different states handled by three
different mechanisms — not variations of one `if` chain.** This is the
main architectural decision this branch makes, so it's worth being
explicit about why they're not unified:

- **Loading** uses Next's file-based Suspense boundary
  (`app/products/loading.tsx`), shown automatically while the async page
  component awaits `getProductsPage`. Nothing in the page component
  itself branches on a loading flag.
- **Empty** (zero products, no error) is a normal, valid business state —
  handled as a plain conditional inside `page.tsx`
  (`products.length === 0`). It is not routed through the error boundary,
  because it isn't an error.
- **Error** (the fetch actually throws — network failure, GraphQL error)
  is handled by `app/products/error.tsx`, Next's error-boundary file
  convention, by *not* wrapping the `getProductsPage` call in `page.tsx`
  in a `try`/`catch` and letting it throw naturally. This replaces the
  manual `try`/`catch` + inline error-string pattern
  `app/dev/products`/`app/dev/graphql` used — appropriate for those quick
  diagnostic pages, not for production UI that needs a real retry
  affordance and shouldn't hand-roll error-message sanitization.

**Verified this Next.js version's actual `error.js` contract instead of
assuming it, per `frontend/AGENTS.md`'s standing warning that this
Next.js version has breaking changes from training-data expectations.**
Checked `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`
directly: this version's error boundary exposes `unstable_retry()` as the
primary recovery function (`reset()` still exists but is now documented
as the fallback for a narrower case), and — usefully — confirms Next
already replaces a thrown Server Component error's message with a
generic message plus a `digest` in production, specifically to avoid
leaking internal details to visitors. `app/products/error.tsx` was
written against that confirmed contract, and its own `console.error` is
there only to correlate that `digest` with server-side logs, not to
recover or re-display the original message client-side.

**Pagination is forward-only (`?after=<cursor>`), not numbered pages —
a real constraint of the data, not a shortcut.** `PRODUCTS_QUERY` (built
in an earlier branch) only requests WPGraphQL's forward Relay connection
args (`first`/`after`, `hasNextPage`/`endCursor`), not the backward ones
(`last`/`before`, `hasPreviousPage`/`startCursor`). A cursor-based "Next"
link, with the browser's own back button covering "previous" (each
"Next" is a real navigation to a new URL, so back just re-requests the
prior `after` value), is the correct pattern for what's actually wired up
today — adding numbered/jump-to-page navigation would need those backward
args added to the query first, which nothing has required yet. Documented
here as a deliberate scope boundary, not a gap (see Future Enhancements
in the deliverables for this branch).

**`?after=` pages are deliberately non-canonical for SEO.** Cursor
pagination has no stable, guessable URL per page number, so indexing
`/products?after=...` variants directly risks duplicate-content
treatment with no real benefit — crawlers still reach every product by
following `Next` links from the canonical `/products`. `generateMetadata`
sets `alternates.canonical` back to `routes.products.index` and
`robots: { index: false, follow: true }` whenever `after` is present.

**`ProductCardSkeleton`/`ProductGridSkeleton` are new, and deliberately
share layout code with the real components, not just their visual
proportions.** `product-grid-layout.ts` (className + `toResponsiveVars`
style) is imported by both `ProductGrid` and `ProductGridSkeleton` — the
alternative (each hand-rolling matching Tailwind classes) risks the two
silently drifting apart, which defeats the entire purpose of a skeleton
(a loading state that doesn't match its own loaded layout causes the
layout shift it exists to prevent). `motion-safe:animate-pulse` (not a
bare `animate-pulse`) keeps the pulse animation off entirely under
`prefers-reduced-motion`, per docs/design-system.md's Motion principles.
`ProductGridSkeleton`'s wrapper carries `role="status"`/`aria-label`
once, at the region level; individual `ProductCardSkeleton`s stay
`aria-hidden` so assistive tech isn't told "loading" eight times over.

**`app/dev/products` deleted.** Its own header comment already documented
exactly this trigger — "safe to delete once real product pages exist" —
and `app/products` is now that real page. Keeping both would have meant
two different (and, after this branch, differently-behaved) code paths
fetching the same data. `app/dev/product-card` and `app/dev/product-grid`
were kept: unlike `app/dev/products` (which only ever proved the
fetch-to-render pipeline worked), they're isolated component fixtures —
still useful for visually checking `ProductCard`/`ProductGrid` in
isolation from a real page or live backend state, which is a genuinely
different job than what `app/products` now does. `app/dev/product-grid`
was extended with a `ProductGridSkeleton` fixture rather than given its
own new dev route, for the same reason.

**Verified against the live backend, not just fixtures — including the
error path.** The WPGraphQL endpoint (`tss.maabara.local`) is actually
reachable from this environment, and the store currently has zero real
products (consistent with earlier schema-investigation ADRs), so the
empty state shown in the screenshot below is the *real* production
behavior today, not a simulated fixture. The error boundary was verified
by running a second, temporary dev server instance with
`NEXT_PUBLIC_GRAPHQL_ENDPOINT` overridden to an unreachable host (an
environment-variable override for that one process only — `.env.local`
was never touched) and confirming `error.tsx` renders instead of the app
crashing. `next build` was also run to confirm the route compiles for
production and is correctly reported as dynamically rendered (`ƒ`, not
statically prerendered) — expected, since reading `searchParams` opts a
page into per-request rendering.
