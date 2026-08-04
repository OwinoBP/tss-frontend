# Product model

`types/music-product.ts` defines `MusicProduct` — the canonical shape every
part of the frontend uses to represent something sold on this marketplace.
This document explains why it exists, what's assumed, and what's
deliberately left out for now.

## Why a canonical model exists

WooCommerce/WPGraphQL's product shape is generic e-commerce: `regularPrice`
as a formatted string, categories and tags as undifferentiated taxonomy
lists, no concept of BPM, musical key, or a producer credit. None of that
is wrong — it's just not what a music marketplace's UI wants to render.

`MusicProduct` is the shape the UI is written against instead. It's the
same idea already established for the service layer
([docs/architecture.md](architecture.md)): components depend on a stable
domain type, not on whatever the backend happens to return.

## Why the frontend shouldn't depend on WooCommerce directly

Three concrete reasons, not just "it's cleaner":

1. **WooCommerce's types leak backend concerns.** Prices come back as
   pre-formatted, locale-specific strings (`"$19.99"`), not `{ amount,
   currency }` — unusable for sorting or arithmetic without re-parsing
   throughout the UI.
2. **This project's music-specific fields aren't in WooCommerce core at
   all.** BPM, musical key, producer credit, and file format will come from
   custom fields or taxonomies whose exact names aren't decided yet. If
   components referenced those field names directly, every naming decision
   would become a breaking change across the whole UI instead of a
   one-line edit to a mapper.
3. **The schema will change before requirements are finalized.** A single
   translation layer (`services/mappers/product.mapper.ts`) means schema
   churn is absorbed in one file instead of wherever a component happened
   to read a field.

## DTO layer

The full intended pipeline, once real queries exist
(see [architecture.md](architecture.md#graphql-flow) for the diagram):

```
WPGraphQL Response -> WooCommerce DTO -> Mapper -> MusicProduct -> Services -> React Components
```

The DTO sits between the raw GraphQL response and the mapper, as its own
stage, rather than the mapper parsing the response directly. It's a type
that mirrors exactly what a specific query returns — WooCommerce's field
names, its Relay-style `{ nodes: [...] }` connection wrappers, nullability
exactly as the schema declares it, prices as WPGraphQL's formatted strings.
Nothing translated yet, just typed.

Why bother with that as a separate type instead of typing the mapper's
parameter as the query result directly (or skipping typing it well at
all)? Three reasons, mirroring the case for the domain model itself:

1. **Compile-time safety at the query boundary.** A DTO typed to match a
   specific query means a changed query or schema field breaks the build
   where the mismatch actually is, not silently at runtime when a
   component reads `undefined`.
2. **The mapper stays a pure function.** `(dto: WooCommerceProductDto) =>
   MusicProduct` is trivially unit-testable with a fixture object — no
   Apollo, no network, no GraphQL client involved in testing the
   transformation logic itself.
3. **WooCommerce's representation quirks have exactly one place to live.**
   Connection wrappers, string-formatted prices, and inconsistent
   nullability get absorbed into DTO -> MusicProduct field mapping, not
   mixed into whatever component happens to touch that field first.

The first DTO now exists: `types/dto/woocommerce-product.dto.ts` defines
`WooCommerceProductDto`, written from live introspection against this
project's actual WPGraphQL endpoint (not guessed — see
[decisions.md](decisions.md) for the full schema investigation). It's
scoped to `SimpleProduct` only; see the DTO file's header comment for why.
`services/mappers/product.mapper.ts` documents the planned field-by-field
mapping from it — the mapping function itself isn't implemented yet, since
there's still no GraphQL query to run it against.

## Fields expected to come from WooCommerce core

Confirmed by introspecting the live schema (see [decisions.md](decisions.md)) —
these are verified field paths, not assumptions:

| Field | WPGraphQL source |
|---|---|
| `id` | `SimpleProduct.id` (Relay global ID) |
| `slug` | `SimpleProduct.slug` |
| `title` | `SimpleProduct.name` — WooCommerce's title field is called `name`, not `title` |
| `description` | `SimpleProduct.description` |
| `categories` | `SimpleProduct.productCategories.nodes` (a real connection; hierarchical taxonomy, supports multiple per product) |
| `tags` | `SimpleProduct.productTags.nodes` (flat taxonomy, no hierarchy) |
| `artwork` | `SimpleProduct.image` (WooCommerce's direct product-image field — used over the generic `featuredImage` connection edge for simplicity). `null` when unset — see "Fields worth revisiting" |
| `gallery` | `SimpleProduct.galleryImages.nodes` |
| `regularPrice`, `salePrice` | `SimpleProduct.regularPrice` / `.salePrice` — string fields, only on the concrete product type, **not** on the shared `Product` interface. Confirmed with a real test product to include a currency symbol (`"$29.99"`), not a bare decimal — the mapper strips it |
| `featured` | `SimpleProduct.featured` |
| `releaseDate` | `SimpleProduct.date` (post publish date), tentatively — see assumptions |

## Fields that will likely be custom metadata

None of these exist in the schema today (confirmed — no ACF or similar
plugin is installed, and no custom taxonomies beyond WooCommerce's own
category/tag/brand exist). All still require backend work before a
mapper can populate them:

| Field | Status |
|---|---|
| `producer` | No native field. **Worth noting:** a `productBrands` taxonomy already exists in the schema (WooCommerce's own Brand feature) and is a strong future candidate — currently empty of terms, not wired into the mapper yet, out of scope for this pass |
| `genres` | No dedicated taxonomy exists; would need a new custom taxonomy |
| `bpm`, `musicalKey` | Audio metadata with no WooCommerce equivalent — would need a custom field |
| `fileFormat` | No dedicated field, but `SimpleProduct.downloads[].fileExt` exists in the schema (WooCommerce's native downloadable-files list) and could plausibly source this without a custom field at all — not wired into the mapper yet |
| `previewUrl`, `duration` | No native field — would need a custom field pointing at an audio file |

## Assumptions made while requirements are unfinalized

These are places the model made a specific choice despite the client's
requirements not yet being confirmed. Each is a plausible default, not a
guarantee — expect some of these to change once real requirements land.

- **`productType` is a closed union of six values** (sample pack, drum kit,
  MIDI pack, preset, one-shot, construction kit) because that's the
  explicit list given for this sprint. Its WooCommerce source is now
  investigated and has a recommendation: a **Global Product Attribute**
  (e.g. an attribute named "Product Type" with those six terms as options),
  configured entirely through the WooCommerce admin UI, no custom code.
  Product Category was ruled out (it's already carrying navigation duty,
  and reusing it risks the same ambiguity flagged for `categories`/`genres`
  below); WooCommerce's built-in `ProductTypesEnum` was ruled out (it's a
  different concept entirely — simple/variable/external/grouped describes
  product *structure*, not music content type); a plain meta field was
  ruled out (no admin UI, no enforced closed set, would still need custom
  GraphQL registration work — no real advantage over an attribute). Not
  implemented yet, per this sprint's scope — see
  [decisions.md](decisions.md) for the full investigation. It's a
  TypeScript string union rather than an `enum` — see
  [`ProductType`'s doc comment](../types/music-product.ts) for the full
  reasoning; in short, it's the type GraphQL string values already satisfy
  with no mapping step, and this project's `isolatedModules: true`
  tsconfig setting rules out `const enum` specifically. Worth revisiting
  if `productType` needs attached runtime data (a `Record<ProductType, T>`
  map usually covers that first) or if WPGraphQL exposes it as a real
  GraphQL enum and a codegen tool starts emitting TS enums for it.
- **`musicalKey` is a plain string, not an enum of the 24 possible keys.**
  A stricter type would enable key-based filtering/search, but that's a
  feature decision, not a modeling one — left loose until that's asked for.
- **`fileFormat` is `string[]`, not a closed union.** The realistic set of
  formats spans audio (WAV, MP3), MIDI, and DAW/plugin-specific presets,
  and isn't finalized. A closed union would need updating every time a new
  format is supported.
- **No inventory/stock fields.** Digital downloads on this kind of
  marketplace are typically unlimited-stock; WooCommerce's stock tracking
  wasn't included on that assumption. Add it if the client sells anything
  with limited availability (e.g. exclusive/limited-run kits).
- **`releaseDate` is assumed to map to WooCommerce's publish date**, but a
  "sample pack" often has a marketing release date distinct from when the
  product page went live. May need to become its own custom field.

## Future extensions

These can be added to `MusicProduct` later without breaking anything that
already depends on it (all additive, none of them change or remove an
existing field). Grouped by what kind of work they'd actually need beyond
"add a field" — some are pure content, some depend on infrastructure that
doesn't exist yet.

**Content fields** — a value someone enters once, no new infrastructure:

- **License** — royalty-free vs. exclusive/licensed usage terms. Likely
  important once the client confirms their licensing model; deferred
  until they do, since guessing the categories (e.g. "royalty-free" /
  "exclusive" / "sync-cleared") without their input risks modeling the
  wrong thing.
- **Demo video** — a video walkthrough of a pack (hosted file or embed).
  Needs its own media type (distinct from `ProductImage`/audio preview);
  deferred as a nice-to-have, not core to a v1 audio marketplace.
- **File size** — total download size (e.g. "450 MB"), useful for setting
  expectations before purchase. Unlike rating/download count below, this
  one isn't a free native field: `SimpleProduct.downloads[]` (WooCommerce's
  downloadable-file list) has no size field in the schema — only
  `MediaItem` (images) exposes `fileSize`. Would need a custom field or a
  separate lookup, not just a DTO addition.
- **Sample rate** and **bit depth** — e.g. "24-bit / 44.1kHz". Genuinely
  useful audio spec detail once `fileFormat` (and how files are actually
  structured) is finalized — adding them before that risks describing
  files that don't match how the catalog ends up organized.
- **Compatibility** — which DAW/plugin a Preset or Construction Kit
  requires (Serum, Kontakt, Ableton, etc.). Deferred until Presets are
  modeled in enough detail to know whether this is one field or a
  structured list (a preset pack might support several plugins).

**Fields that turned out simpler than expected, once the schema was
actually checked** — correcting an earlier assumption:

- **Rating** and **review count** — `SimpleProduct.averageRating` and
  `.reviewCount` are real, native, per-product fields — no aggregation
  needed on the frontend side at all. Still deferred (not part of this
  sprint's scope), but adding them later is a one-line DTO/mapper addition,
  not new infrastructure.
- **Download count** — `SimpleProduct.totalSales` is a real native field.
  It counts sales, not downloads specifically, but for a digital-download
  product those are effectively the same number. Same story as rating: a
  cheap future addition, not a data-pipeline project.

**Deferred structural additions** (need their own nested type, not just a
scalar field):

- **Preview waveform** — static waveform image or peak-data array for an
  audio player UI. Deferred because the shape depends entirely on which
  audio player component gets built (an image URL vs. a numeric array are
  very different fields) — better decided alongside that UI work.
- **Pack contents manifest** — a breakdown like "24 Loops, 12 One Shots, 4
  MIDI Files" for construction kits and sample packs. Deferred because it
  needs a list of included files/stems with their own metadata, and
  there's no confirmed need for it yet.
- **Stems/multitrack flag** — whether a construction kit includes
  separated stems. Small addition, deferred until construction kits are
  in scope.
- **Related/bundle products** — cross-sell or "part of a series"
  relationships. Deferred — depends on how WooCommerce bundling/upsells
  are configured, which isn't decided.

## Fields worth revisiting

Called out here so they're easy to find, not because they're wrong today.
This is a critical pass, not a to-do list — none of these are being
changed without the client's input.

- **`categories` and `genres` may end up duplicating each other.** Now
  that `categories` is an array (matching WooCommerce), both fields are
  `TaxonomyTerm[]` with no structural difference — the only thing keeping
  them distinct is what they're *for* (store navigation vs. musical
  style). If the client's actual WooCommerce setup uses one taxonomy for
  both (e.g. categories literally named "Trap", "Lo-Fi", "Drum Kits"),
  keeping both fields means one of them is permanently empty or
  duplicated data. **Recommendation:** confirm the client's taxonomy plan
  before both are wired up in the mapper — if there's no genre-specific
  taxonomy in WooCommerce, drop `genres` and let `categories` carry
  genre information instead of modeling a distinction that doesn't exist
  in the data.
- **`producer` as a full object may be premature.** It's modeled as `{ id,
  name, slug, avatarUrl }` to support producer profile pages later, which
  fits a Sample-Select-style marketplace — but if that feature isn't
  planned, this is more structure than the data needs.
  **Recommendation:** keep it as-is for now (the cost of the extra
  structure is low and it's a natural fit for the product category), but
  don't build a producer-page feature on the assumption it's wanted —
  confirm first.
- **`description` was added beyond the brief's field list.** Every
  product page needs one, but confirm whether the client wants a single
  description or a WooCommerce-style short + long description pair.
- **`musicalKey` and `fileFormat`** are intentionally loose (`string` /
  `string[]`) rather than closed unions. Worth tightening once there's a
  concrete reason to (filtering UI, search facets) — but not before.
- **`artwork` is now `ProductImage | null`**, changed while wiring up the
  real mapper (`services/mappers/product.mapper.ts`). Unlike the gaps
  above, this wasn't a "not built yet" placeholder situation — a
  WooCommerce product can permanently have no image set, which is a real
  domain state, not a temporary one. See the ADR in
  [decisions.md](decisions.md).
- **`productType` and `producer` are populated with fixed placeholder
  values today** (`"sample-pack"` and `{ name: "Unknown Producer", ... }`),
  not real per-product data — every mapped product currently gets the
  same values for both. This is intentional and documented loudly in
  `product.mapper.ts` and [docs/api/product-query.md](api/product-query.md),
  not a bug — there's still no WooCommerce source for either field.

## Validated by feature/product-detail: the model didn't need to change

`feature/product-detail` was scoped partly as a validation pass for this
model — building the first *rich* product view (as opposed to
`ProductCard`'s summary) is exactly the kind of work that would expose a
missing field. It didn't: **no field was added to `MusicProduct`.**

- **`description` and `gallery`** were already present, already fetched
  by the mapper, and already correctly typed — they simply had no
  presentation-layer consumer until `ProductInfo`/`ProductGallery`. That
  they slotted in with zero model changes is a good sign the original
  model wasn't under-scoped for a detail view, just ahead of the UI that
  would exercise it.
- **`categories`, `tags`, `producer`, `productType`** all rendered
  correctly with existing fields and existing (documented) placeholder
  behavior — see "Fields worth revisiting" above. The detail page doesn't
  hide or work around the `productType`/`producer` placeholders; it
  displays them exactly as `ProductCard` already does, since that's the
  honest current state of the data.
- **`bpm`, `musicalKey`, `fileFormat`, `duration`, `previewUrl`** were
  deliberately *not* given any UI in this pass, and the model was not
  touched to make room for them either. All five remain `null`/`[]` for
  every product (no WooCommerce/WPGraphQL source exists for any of them —
  see "Fields that will likely be custom metadata" above); building
  display UI for fields that can never currently hold data, or widening
  the model preemptively, would be exactly the kind of speculative work
  this document's own stated approach avoids. Add the field, the query
  selection, and the UI together, once one of these has a real backend
  source — not before.

## See also

- [design-system.md](design-system.md#product-card-anatomy) — how these
  fields are intended to be displayed once product UI is built
- [component-principles.md](component-principles.md) — the rule that
  components consume this model directly, never the DTO it's mapped from
