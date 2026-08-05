import type { Metadata } from "next";

/**
 * The metadata fallback every Detail page's `generateMetadata` returns
 * from its own "resource doesn't exist" branch, alongside rendering
 * `DetailNotFound` in the page body. Next's real `notFound()`/`not-found.tsx`
 * sets `noindex` automatically; since Detail pages deliberately don't use
 * that mechanism (see docs/decisions.md, "Detail Page Pattern Hardening"),
 * this replicates the one part of it that matters for SEO. Named
 * specifically (not a generic `NOT_FOUND_METADATA`) so it stays
 * unambiguous once the app has other kinds of "not found" — a Listing
 * page's zero-results state, for instance, is a different, valid state
 * that must stay indexable and must never use this constant.
 */
export const DETAIL_NOT_FOUND_METADATA: Metadata = {
  robots: { index: false, follow: true },
};
