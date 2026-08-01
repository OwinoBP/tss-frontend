# Product query

The first real WooCommerce product integration. This documents what
`graphql/queries/products.query.ts` retrieves, how it becomes a
`MusicProduct`, and what's deliberately not requested yet.

## Pipeline

```
GraphQL Query (graphql/queries/products.query.ts, graphql/fragments/product-card.fragment.ts)
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
Service (services/product.service.ts — getProducts)
   │  runs the query, filters non-SimpleProduct nodes, maps, returns MusicProduct[]
   ▼
Server Component (app/dev/products/page.tsx)
   │  calls getProducts(), renders — has no GraphQL/Apollo knowledge at all
```

Verified live, end to end, against this project's actual WPGraphQL
endpoint: a temporary WooCommerce product was created via `wp wc product
create` (with a category, a tag, a featured image, a regular and sale
price), fetched through `/dev/products`, confirmed to render correctly
mapped data, then deleted — the store has no real products yet, so this
was the only way to confirm the mapper against real data rather than only
against the empty-catalog case. See "WooCommerce limitations discovered"
below for what that test surfaced.

## Fields currently retrieved, and why

| Field (`ProductCardFields` fragment) | MusicProduct field | Why it's included |
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
