/**
 * Regex-strips tags for a plain-text `<meta name="description">` — search
 * engines expect plain text there regardless of a field's rendered-HTML
 * trust level (see docs/decisions.md's trust-boundary note on
 * `descriptionHtml`). Extracted from `app/products/[slug]/page.tsx` once
 * `app/categories/[slug]/page.tsx` needed the identical transform for a
 * category's `description` field, same as `formatMoney`'s extraction.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
