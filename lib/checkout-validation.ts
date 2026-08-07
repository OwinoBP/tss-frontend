import { COUNTRIES } from "@/data/countries";
import type { OrderAddress } from "@/types/order";

/**
 * Confirmed live: WPGraphQL's `checkout` mutation enforces almost nothing
 * about billing/shipping completeness — a real order was created with a
 * completely empty billing address (see docs/decisions.md, "Checkout").
 * The two things it *does* validate server-side (a malformed email, an
 * out-of-enum country) are re-checked here too, but this module exists
 * because everything else — required fields — has no backend enforcement
 * to lean on at all.
 */
export type AddressFieldErrors = Partial<Record<keyof OrderAddress, string>>;

const REQUIRED_ADDRESS_FIELDS: readonly (keyof OrderAddress)[] = [
  "firstName",
  "lastName",
  "address1",
  "city",
  "postcode",
  "country",
];

const VALID_COUNTRY_CODES = new Set(COUNTRIES.map((country) => country.code));

/** Deliberately loose — matches this project's existing validation depth elsewhere, not a full RFC 5322 implementation. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAddress(
  address: OrderAddress,
  { requireEmail }: { requireEmail: boolean },
): AddressFieldErrors {
  const errors: AddressFieldErrors = {};

  for (const field of REQUIRED_ADDRESS_FIELDS) {
    if (!address[field].trim()) {
      errors[field] = "Required.";
    }
  }

  if (address.country && !VALID_COUNTRY_CODES.has(address.country)) {
    errors.country = "Select a valid country.";
  }

  if (requireEmail && !address.email.trim()) {
    errors.email = "Required.";
  } else if (address.email.trim() && !EMAIL_PATTERN.test(address.email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

export function hasFieldErrors(errors: AddressFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
