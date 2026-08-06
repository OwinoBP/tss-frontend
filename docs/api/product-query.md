# Product query

The WooCommerce product integration — both the listing query
(`graphql/queries/products.query.ts`) and the single-product query
(`graphql/queries/product.query.ts`, added in `feature/product-detail`).
This documents what each retrieves, how the response becomes a
`MusicProduct`, and what's deliberately not requested yet.

## Pipeline

```
GraphQL Query (products.query.ts or product.query.ts, both built on
               graphql/fragments/product.fragment.ts)
   │  Apollo Client, via lib/apollo/rsc-client.ts
   ▼
DTO (WooCommerceProductDto — types/dto/woocommerce-product.dto.ts)
   │  exactly mirrors the query's response shape
   ▼
Mapper (services/mappers/product.mapper.ts)
   │  the only code that knows both the DTO and MusicProduct shapes
   ▼
MusicProduct (types/music-product.ts)
   │  what everything downstream depends on
   ▼
Service (services/product.service.ts — getProductsPage/getProducts, getProduct)
   │  runs the query, filters non-SimpleProduct nodes, maps, returns
   │  MusicProduct[] (list) or MusicProduct | null (single)
   ▼
Server Component (app/products/page.tsx, app/products/[slug]/page.tsx,
                  app/search/page.tsx)
   │  calls the service, renders — has no GraphQL/Apollo knowledge at all
```

Both queries share one fragment (`PRODUCT_FIELDS_FRAGMENT`) rather than
each defining their own selection set — see docs/decisions.md, "Product
Detail" for why splitting them would have added maintenance cost with no
corresponding benefit (the fragment already selects everything
`MusicProduct` needs, not a card-specific subset, despite its former
name).

Verified live, end to end, against this project's actual WPGraphQL
endpoint, four times: once for the listing query (a temporary WooCommerce
product created via `wp wc product create` — category, tag, featured
image, regular and sale price — fetched, confirmed correctly mapped,
then deleted); again for the single-product query in
`feature/product-detail` (a second temporary product, this time with a
real image gallery and an HTML-formatted description, confirmed via a
direct `curl` against the GraphQL endpoint and then through the real
`/products/[slug]` route, then deleted); again for the listing
query's `where` argument in `feature/product-search` (four temporary
products, confirming a real match, a real no-match, and real
`where`+pagination combined via `app/search`, then deleted — see
docs/decisions.md, "Product Search"); and again for `where`'s
price/on-sale/orderby fields in `feature/filtering-and-sorting` (five
temporary products with varied prices and sale status, confirming
filtering, sorting, and pagination compose correctly together, then
deleted — see docs/decisions.md, "Filtering and Sorting"). The store has
no real products outside these temporary, cleaned-up tests. See
"WooCommerce limitations discovered" below for what each surfaced.

## Filtering and sorting the listing query (`where`)

`PRODUCTS_QUERY` accepts an optional `$where:
RootQueryToProductConnectionWhereArgs` variable, passed to
`products(first: $first, after: $after, where: $where)`. Confirmed via
live introspection (`feature/product-search`, extended in
`feature/filtering-and-sorting`) that this argument exists on the
`products` root field and includes `search: String`, `category: String`,
`minPrice`/`maxPrice: Float`, `onSale: Boolean`, `orderby: [ProductsOrderbyInput]`,
and more not requested here (`tag`, `productBrand`, `featured`, etc. —
real, confirmed available, added only if/when a page actually needs one).
`graphql/queries/products.query.ts` types the subset actually used as
`ProductsQueryWhere`:

```ts
interface ProductsQueryWhere {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  orderby?: { field: "DATE" | "NAME" | "PRICE"; order?: "ASC" | "DESC" }[];
}
```

`services/product.service.ts`'s `GetProductsParams.where` passes straight
through to this variable — `app/products/page.tsx` sets `where.orderby`
(always, resolving to a default "newest" ordering) plus whatever
price/sale filters are active, `app/search/page.tsx` adds `where.search`
on top of the same, `app/categories/[slug]/page.tsx` adds `where.category`
on top of the same. A blank search query is *not* sent as `where: {
search: "" }` — `app/search/page.tsx` trims and checks it before calling
the service at all, so "no query submitted" never reaches WPGraphQL.

**`orderby` lives inside `where`, not as a sibling `products(...)` arg —
confirmed via introspection, not assumed from the field's name.**
`ProductsOrderByEnum` has more real values than this project currently
exposes in the UI (`DATE`, `MENU_ORDER`, `MODIFIED`, `NAME`, `PARENT`,
`POPULARITY`, `PRICE`, `RATING`, `REVIEW_COUNT`, `SLUG`) — only `DATE`,
`NAME`, `PRICE` are wired into `data/sort-options.ts`; see
docs/decisions.md, "Filtering and Sorting" for why `POPULARITY`/`RATING`
were deliberately left out despite being real, confirmed-available
fields.

**Confirmed live with five temporary products of varied price/sale
status: `minPrice`/`maxPrice` filter on the *effective* (sale-aware)
price, not the regular price** — a product with a $30 regular / $20 sale
price was included by `minPrice: 15`, while a product with a $15 regular
/ $12 sale price was correctly excluded by the same filter. This is the
behavior a customer-facing "price" filter should have.

**`productType`, `productBrand`/`tag` filtering: confirmed real
capabilities in the schema, deliberately not wired up this pass.**
`productType` (the music-domain field, not WooCommerce's own product
type) has no working filter path at all today — see "productType still
has no filterable source" below. `productBrand`/`tag` filters are
schema-real but excluded because there's no real data (`productBrands`
still has zero terms) or browsing UI (no tag vocabulary/route exists) to
back a facet with — see docs/decisions.md, "Filtering and Sorting."

**Confirmed live: an empty `search` match returns a clean `{ nodes: [],
pageInfo: { hasNextPage: false, endCursor: null } }`**, no error — same
"empty is a valid state, not a failure" shape the rest of this query
already returns for an empty catalog. `where.search`, `where.orderby`,
`where.minPrice`/`maxPrice`/`onSale`, and `first`/`after` all compose
normally together (confirmed with a real multi-product match set, a real
sorted+filtered result, and a real second page fetched through the
actual cursor while a filter/sort stayed active).

## Fields currently retrieved, and why

| Field (`ProductFields` fragment) | MusicProduct field | Why it's included |
|---|---|---|
| `__typename` | — (used by the service, not the domain model) | Every node in `products.nodes` is typed `Product` (the shared interface); this is how the service tells a real `SimpleProduct` apart from any other concrete type before treating it as a `WooCommerceProductDto` |
| `id` | `id` | Stable identity |
| `databaseId` | — (fallback source for `slug`) | Cheap, always-present numeric ID; used when `slug` is null |
| `slug` | `slug` | Routing |
| `name` | `title` | WooCommerce's title field — it's called `name`, not `title` |
| `description` | `description` | Product description |
| `featured` | `featured` | WooCommerce's featured flag |
| `date` | `releaseDate` | Tentative source — see docs/product-model.md assumptions; publish date isn't necessarily a music release date |
| `regularPrice` | `regularPrice` | Base price |
| `salePrice` | `salePrice` | Sale price, when present |
| `image { id sourceUrl altText mediaDetails { width height } }` | `artwork` | Primary product image — everything `ProductImage` needs, nothing more |
| `galleryImages { nodes { ...same shape... } }` | `gallery` | Additional images |
| `productCategories { nodes { id databaseId name slug } }` | `categories` | Store categories, plural (WooCommerce allows more than one) |
| `productTags { nodes { id databaseId name slug } }` | `tags` | Free-form tags |

Every field selected has a direct line to a `MusicProduct` field (or, for
`__typename`/`databaseId`, a direct role in producing one correctly) — no
field was added "in case it's useful."

## Fields intentionally omitted

Not requested, because nothing in the schema maps to the `MusicProduct`
field they'd serve (confirmed by schema investigation — see
docs/decisions.md, not guessed):

- `bpm`, `musicalKey`, `previewUrl`, `duration`, `fileFormat` — no
  WooCommerce/WPGraphQL field exists for any of these yet.
- `genres` — no dedicated taxonomy exists (`productCategories`/`productTags`
  are requested; a genre-specific one isn't).
- `producer` — no field maps to this. `productBrands` exists in the schema
  as a real, empty-of-terms taxonomy and is a likely future source, but
  wiring it up is out of scope for this pass — not requested here.
- `productType` (the business classification, not WooCommerce's own
  simple/variable/external/grouped distinction) — no field maps to this
  either. See docs/decisions.md for the recommended source (a WooCommerce
  Global Product Attribute) and why category/WooCommerce's built-in type
  enum/a meta field were all ruled out.

  **`productType` still has no filterable source, re-confirmed live in
  `feature/filtering-and-sorting`.** The schema mechanism a Global
  Product Attribute filter would use (`where.attributes`) exists, but
  `ProductAttributeEnum` — which attribute taxonomies are actually
  registered — has exactly one value, `NONE`: no "Product Type" attribute
  has been created in WooCommerce. Even if it existed, every product is
  currently mapped to the same placeholder `productType` value (see
  "Known gaps in the mapper" below), so a filter over it wouldn't
  distinguish anything yet either way. `productType` filtering was
  confirmed out of scope for this branch rather than built as a
  non-functional control — see docs/decisions.md, "Filtering and
  Sorting."

Also not requested, present in the schema but out of scope for a
product-card query specifically: `sku`, `averageRating`, `reviewCount`,
`totalSales`, `downloads`, generic `metaData`. These are real, confirmed
fields (see docs/product-model.md, Future Extensions) — add them to the
fragment only when a `MusicProduct` field exists to receive them.

## Known gaps in the mapper (placeholders, not real data)

Two required `MusicProduct` fields have no WooCommerce source at all right
now, so the mapper assigns the same fixed placeholder to every product
rather than leaving them unset:

- `productType` → always `"sample-pack"` (`UNRESOLVED_PRODUCT_TYPE` in
  `product.mapper.ts`)
- `producer` → always `{ name: "Unknown Producer", ... }`
  (`UNRESOLVED_PRODUCER` in `product.mapper.ts`)

Both are called out prominently in the mapper's source and in
docs/decisions.md so they don't get mistaken for real classification once
products with actual data exist. Neither required widening the
`MusicProduct` type — see the ADR in docs/decisions.md for why that would
have been the wrong fix (these are temporary backend gaps, not permanent
domain truths).

One field *did* need a type change: `artwork` is now `ProductImage | null`
— a product genuinely can have no image set, permanently, which is
different from the placeholder situation above. See docs/decisions.md.

## The single-product query (`product.query.ts`)

```graphql
query Product($slug: ID!) {
  product(id: $slug, idType: SLUG) {
    ... on SimpleProduct {
      ...ProductFields
    }
  }
}
```

`product(id, idType: SLUG)` was confirmed via live introspection to be
the correct, non-deprecated root field (`simpleProduct` also exists and
returns `SimpleProduct` directly, avoiding the inline fragment, but is
schema-deprecated in favor of `product` — not used here).

**Confirmed live: querying a slug that doesn't exist returns
`data.product: null` together with a top-level GraphQL error**
(`"No product ID was found corresponding to the slug: ..."`), not a
clean null with no errors. This is why `product.service.ts`'s
`getProduct` uses `errorPolicy: "all"` rather than the listing query's
`"none"`, and why it checks `data` itself (not just `data.product`)
before treating a null product as "not found" rather than "the request
failed outright" — see docs/decisions.md, "Product Detail" for the full
reasoning and the bug this distinction fixed.

**Confirmed live: `description` returns rendered HTML**
(`<p>`, `<strong>`, `<ul><li>`), not plain text — verified by creating a
temporary product with a formatted description and querying it directly.
This confirms the trust-boundary decision documented in docs/decisions.md
(rendered via `dangerouslySetInnerHTML` in `ProductInfo`, since it's
WordPress-admin-authored content, not user input).

## The category query (`category.query.ts`)

`feature/category-pages` adds a second, unrelated query —
`CATEGORY_QUERY` (`graphql/queries/category.query.ts`), run through
`services/category.service.ts`'s `getCategory(slug)`. Not part of the
`ProductFields`/`PRODUCT_FIELDS_FRAGMENT` pipeline above: a category's own
metadata (needed to render a heading/description even for a category with
zero products) has no product-shaped equivalent, so it's its own DTO
(`types/dto/woocommerce-category.dto.ts`) and mapper
(`services/mappers/category.mapper.ts`), following the same DTO -> mapper
-> domain shape as products.

```graphql
query Category($slug: ID!) {
  productCategory(id: $slug, idType: SLUG) {
    id
    databaseId
    name
    slug
    description
    image { id sourceUrl altText mediaDetails { width height } }
    parent { node { id name slug } }
    ancestors { nodes { id name slug } }
  }
}
```

**Confirmed live: a nonexistent category slug returns a clean
`{ productCategory: null }`, with no GraphQL error attached** — a real
difference from the single-product query above (`product(idType: SLUG)`
returns `null` *with* an error for a bad slug). `getCategory` uses plain
`errorPolicy: "none"` and has no "not found vs. request failed"
ambiguity to resolve, unlike `getProduct`.

**Confirmed live: `ancestors` is ordered immediate-parent-first** (nearest
ancestor at index 0, root last) — verified with a real three-level
temporary category tree, not assumed from the field name.
`category.mapper.ts` reverses this to root-first order for breadcrumb
rendering.

## WooCommerce limitations discovered

- **Prices are formatted strings, confirmed with a real product**: WPGraphQL
  returned `regularPrice: "$29.99"` for a test product — a currency symbol
  is included, not a bare decimal. The mapper's defensive stripping
  (`replace(/[^0-9.-]/g, "")`) handles this correctly, verified against
  that real value, not assumed.
- **No currency field exists anywhere in the schema** for a product query
  (confirmed by searching every type during schema investigation — the
  only `currency` field in the entire schema is `Order.currency`).
  `wcSettings(group: "general")` could theoretically supply the store's
  currency, but it's a generic settings-API passthrough, not a typed
  field, and would be a separate store-wide fetch, not a per-product one.
  The mapper hardcodes `"USD"` until this is resolved.
- **Date format wasn't verified against real data confidently enough to
  trust as-is**: the mapper normalizes `date` through `new Date(...).toISOString()`
  defensively rather than passing it through, since `MusicProduct.releaseDate`
  is documented as ISO 8601 and WPGraphQL's exact format wasn't
  independently confirmed to already match.
- **`products.nodes` is the `Product` interface, not `SimpleProduct`** —
  confirmed via introspection in the prior schema-investigation pass, and
  the reason the query needs an inline fragment and the service needs a
  `__typename` filter. Any non-`SimpleProduct` node would otherwise come
  back missing nearly every field this query asks for, silently violating
  the DTO's type.
