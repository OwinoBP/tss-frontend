// Product mapper
//
// Transforms a WooCommerceProductDto (types/dto/woocommerce-product.dto.ts)
// into the canonical MusicProduct (types/music-product.ts). Full intended
// pipeline:
//
//   WPGraphQL Response -> WooCommerce DTO -> Mapper -> MusicProduct -> Services -> React Components
//
// The DTO is a separate stage from MusicProduct on purpose. It's a type
// that mirrors exactly what a given GraphQL query returns — WooCommerce's
// field names, its Relay-style `{ nodes: [...] }` connection wrappers,
// nullable fields exactly as the schema declares them, prices as the
// formatted strings WPGraphQL sends. MusicProduct mirrors none of that; it's
// shaped for what the UI needs. Collapsing the two into one step (parsing
// a raw GraphQL response directly into MusicProduct inline) would mean:
//
//   - the mapper's input is only as typed as the raw query result, so a
//     typo in a field path fails silently at runtime instead of at compile time
//   - every WooCommerce quirk (nodes[] wrappers, string prices, nullable
//     fields that are "never actually null in practice") has nowhere to be
//     absorbed except the mapper body itself, mixed in with the real
//     transformation logic
//   - the mapper can't be unit tested with a plain fixture object typed
//     against something real
//
// With a DTO, the mapper is a pure `(dto: WooCommerceProductDto) =>
// MusicProduct` function: fully typed on both sides, testable with fixture
// DTOs, and the one place allowed to know both shapes at once.
//
// The DTO itself (types/dto/woocommerce-product.dto.ts) was written from
// live schema introspection against this project's actual WPGraphQL
// endpoint, not guessed — see docs/decisions.md for the full investigation.
// It currently covers `SimpleProduct` only; see the DTO file's header
// comment for why.
//
// Implementation lands once the first product GraphQL query exists.
// Planned mapping, field by field, using the verified DTO field paths:
//
//   MusicProduct field  <- WooCommerceProductDto source
//   -----------------------------------------------------------------------
//   id                  <- dto.id
//   slug                <- dto.slug
//   title               <- dto.name (WooCommerce's product title field is called `name`)
//   description         <- dto.description
//   productType         <- NOT YET AVAILABLE — no schema field maps to this today.
//                           Recommended long-term source: a WooCommerce Global
//                           Product Attribute (e.g. "Product Type"), not a
//                           category, not WooCommerce's built-in ProductTypesEnum
//                           (that's simple/variable/external/grouped — a
//                           different concept). Full reasoning in docs/decisions.md.
//   categories           <- dto.productCategories.nodes
//   genres                <- still no dedicated taxonomy exists in the schema — see docs/product-model.md
//   tags                  <- dto.productTags.nodes
//   producer               <- still no schema field maps to this. Worth noting: a
//                            `productBrands` taxonomy already exists in the schema
//                            (currently empty of terms) and is a strong future
//                            candidate — not wired up here, out of scope for this pass.
//   artwork               <- dto.image (sourceUrl, altText, mediaDetails.width/height)
//   gallery               <- dto.galleryImages.nodes
//   bpm                   <- still no schema field maps to this — custom meta field, not yet registered
//   musicalKey            <- still no schema field maps to this — custom meta field, not yet registered
//   fileFormat            <- still no schema field maps to this. Worth noting:
//                            SimpleProduct.downloads[].fileExt exists in the schema
//                            (WooCommerce's native downloadable-files list) and could
//                            source this without any custom field — not wired up here.
//   duration               <- still no schema field maps to this — custom meta field, not yet registered
//   previewUrl             <- still no schema field maps to this — custom meta field, not yet registered
//   regularPrice          <- dto.regularPrice (string) parsed into { amount, currency }
//   salePrice             <- dto.salePrice (string, nullable) parsed into { amount, currency } | null
//   featured              <- dto.featured
//   releaseDate           <- dto.date, unless the client wants a separate release date field
//
// export function mapWooCommerceProductToMusicProduct(dto: WooCommerceProductDto): MusicProduct {
//   ...
// }
