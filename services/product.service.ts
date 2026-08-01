// Product service
//
// The single entry point UI code uses to read WooCommerce product data.
// Components must call these methods instead of executing GraphQL queries
// directly — that's what keeps data-fetching logic out of the component
// tree and behind one boundary:
//
//   React Components -> Services -> Apollo Client -> GraphQL -> WordPress
//
// Each method below will wrap a query from graphql/queries/ and a mapper
// from services/mappers/ once those exist, returning MusicProduct
// (types/music-product.ts) rather than raw GraphQL response shapes.

// export async function getFeaturedProducts(): Promise<MusicProduct[]> { ... }

// export async function getProduct(slug: string): Promise<MusicProduct> { ... }

// export async function getProducts(params: GetProductsParams): Promise<MusicProduct[]> { ... }

// export async function searchProducts(term: string): Promise<MusicProduct[]> { ... }
