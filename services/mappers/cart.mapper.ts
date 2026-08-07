import type { Cart, CartLineItem } from "@/types/cart";
import type {
  WooCommerceCartDto,
  WooCommerceCartItemDto,
} from "@/types/dto/woocommerce-cart.dto";
import { storeConfig } from "@/lib/config";

// Cart mapper
//
// Transforms a WooCommerceCartDto (types/dto/woocommerce-cart.dto.ts) into
// the canonical Cart (types/cart.ts). Pure — no Apollo, no React, no I/O.
// Same DTO -> mapper -> domain pipeline as product.mapper.ts/category.mapper.ts.

const FALLBACK_CURRENCY = storeConfig.currency.code;

export function mapWooCommerceCart(dto: WooCommerceCartDto): Cart {
  return {
    items: dto.contents.nodes.map(mapCartItem),
    itemCount: dto.contents.itemCount,
    subtotal: parseMoney(dto.subtotal),
    total: parseMoney(dto.total),
    totalTax: parseMoney(dto.totalTax),
    isEmpty: dto.isEmpty,
  };
}

function mapCartItem(item: WooCommerceCartItemDto): CartLineItem {
  const product = item.product?.node ?? null;
  const lineSubtotal = parseMoney(item.total);

  return {
    key: item.key,
    product: {
      productId: product?.databaseId ?? 0,
      slug: product?.slug ?? "",
      title: product?.name ?? "Untitled Product",
      artwork: product?.image?.sourceUrl
        ? { url: product.image.sourceUrl, alt: product.image.altText ?? "", width: null, height: null }
        : null,
    },
    quantity: item.quantity,
    // No per-unit price field exists on CartItem (confirmed via
    // introspection — see docs/decisions.md, "Cart"); derived from the
    // line total instead, same defensive-parse approach as product prices.
    unitPrice: {
      amount: item.quantity > 0 ? lineSubtotal.amount / item.quantity : 0,
      currency: FALLBACK_CURRENCY,
    },
    lineSubtotal,
  };
}

/** Same defensive strip as product.mapper.ts's parseMoney — WooCommerce cart totals are formatted strings too. */
function parseMoney(raw: string | null) {
  const amount = raw ? Number(raw.replace(/[^0-9.-]/g, "")) : 0;
  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currency: FALLBACK_CURRENCY,
  };
}
