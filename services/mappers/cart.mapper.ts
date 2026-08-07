import type { Cart, CartLineItem } from "@/types/cart";
import type {
  WooCommerceCartDto,
  WooCommerceCartItemDto,
} from "@/types/dto/woocommerce-cart.dto";
import { storeConfig } from "@/lib/config";
import { parseMoney } from "@/lib/parse-money";

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
    subtotal: parseMoney(dto.subtotal, FALLBACK_CURRENCY),
    total: parseMoney(dto.total, FALLBACK_CURRENCY),
    totalTax: parseMoney(dto.totalTax, FALLBACK_CURRENCY),
    isEmpty: dto.isEmpty,
    needsShippingAddress: dto.needsShippingAddress,
    chosenShippingMethods: (dto.chosenShippingMethods ?? []).filter((method): method is string => Boolean(method)),
  };
}

function mapCartItem(item: WooCommerceCartItemDto): CartLineItem {
  const product = item.product?.node ?? null;
  const lineSubtotal = parseMoney(item.total, FALLBACK_CURRENCY);

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
