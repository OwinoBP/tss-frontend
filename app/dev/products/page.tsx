import { getProducts } from "@/services/product.service";
import type { MusicProduct } from "@/types/music-product";

/**
 * Temporary page to verify the product data flow works end to end:
 * WPGraphQL -> DTO -> mapper -> MusicProduct -> service -> here. Not
 * linked from the app; safe to delete once real product pages exist.
 */
export default async function ProductsDevPage() {
  let products: MusicProduct[] | null = null;
  let errorMessage: string | null = null;

  try {
    products = await getProducts();
  } catch (cause) {
    errorMessage = cause instanceof Error ? cause.message : "Unknown error";
  }

  if (!products) {
    return (
      <div style={{ padding: 24, fontFamily: "monospace" }}>
        <h1>Failed to load products</h1>
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: 24, fontFamily: "monospace" }}>
        <h1>Products</h1>
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>Products ({products.length})</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id} style={{ marginBottom: 16 }}>
            <p>
              <strong>{product.title}</strong>
            </p>
            <p>Producer: {product.producer.name}</p>
            <p>
              Price: {product.regularPrice.amount} {product.regularPrice.currency}
            </p>
            <p>
              Categories:{" "}
              {product.categories.map((category) => category.name).join(", ") ||
                "None"}
            </p>
            <p>Image: {product.artwork ? product.artwork.url : "No image"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
