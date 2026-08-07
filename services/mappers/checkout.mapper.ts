import type { Order, OrderAddress, OrderStatus, PaymentGateway } from "@/types/order";
import type {
  WooCommerceOrderAddressDto,
  WooCommerceOrderDto,
  WooCommercePaymentGatewayDto,
} from "@/types/dto/woocommerce-checkout.dto";
import { storeConfig } from "@/lib/config";
import { parseMoney } from "@/lib/parse-money";

// Checkout mapper
//
// Transforms WooCommerceOrderDto/WooCommercePaymentGatewayDto
// (types/dto/woocommerce-checkout.dto.ts) into the canonical Order/
// PaymentGateway (types/order.ts). Pure — no Apollo, no React, no I/O.
// Same DTO -> mapper -> domain pipeline as product.mapper.ts/cart.mapper.ts.

const FALLBACK_CURRENCY = storeConfig.currency.code;

const VALID_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
  "CHECKOUT_DRAFT",
];

function mapOrderStatus(raw: string | null): OrderStatus {
  return (VALID_STATUSES as readonly string[]).includes(raw ?? "") ? (raw as OrderStatus) : "PENDING";
}

export function mapWooCommerceOrder(dto: WooCommerceOrderDto): Order {
  return {
    databaseId: dto.databaseId,
    orderNumber: dto.orderNumber ?? String(dto.databaseId),
    status: mapOrderStatus(dto.status),
    total: parseMoney(dto.total, FALLBACK_CURRENCY),
    subtotal: parseMoney(dto.subtotal, FALLBACK_CURRENCY),
    shippingTotal: parseMoney(dto.shippingTotal, FALLBACK_CURRENCY),
    totalTax: parseMoney(dto.totalTax, FALLBACK_CURRENCY),
    discountTotal: parseMoney(dto.discountTotal, FALLBACK_CURRENCY),
    paymentMethod: dto.paymentMethod ?? "",
    paymentMethodTitle: dto.paymentMethodTitle ?? "",
    billing: mapOrderAddress(dto.billing),
    // A guest checkout that never set `shipToDifferentAddress` gets its
    // `shipping` address back from WooCommerce as a copy of billing with
    // all fields present but semantically unset — rather than guess at
    // that distinction here, `shipping` stays `null` unless a real,
    // non-empty shipping address was submitted (see checkout.service.ts,
    // which only passes `shipping` through when the form actually
    // collected one).
    shipping: dto.shipping && hasAddressContent(dto.shipping) ? mapOrderAddress(dto.shipping) : null,
  };
}

function mapOrderAddress(dto: WooCommerceOrderAddressDto | null): OrderAddress {
  return {
    firstName: dto?.firstName ?? "",
    lastName: dto?.lastName ?? "",
    company: dto?.company ?? "",
    address1: dto?.address1 ?? "",
    address2: dto?.address2 ?? "",
    city: dto?.city ?? "",
    state: dto?.state ?? "",
    postcode: dto?.postcode ?? "",
    country: dto?.country ?? "",
    email: dto?.email ?? "",
    phone: dto?.phone ?? "",
  };
}

function hasAddressContent(dto: WooCommerceOrderAddressDto): boolean {
  return Boolean(dto.address1 || dto.city || dto.postcode);
}

export function mapWooCommercePaymentGateway(dto: WooCommercePaymentGatewayDto): PaymentGateway {
  return {
    id: dto.id,
    title: dto.title ?? dto.id,
    description: dto.description ?? "",
  };
}
