# Setup

## Required software

- Node.js (matching `@types/node` ^20 — Node 20 LTS or newer)
- npm (repo uses `package-lock.json`)
- Git
- A running WordPress + WooCommerce backend with WPGraphQL and WPGraphQL
  for WooCommerce active, reachable over HTTP(S)

## Local development

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment variables

Create `frontend/.env.local` (gitignored):

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-wp-site.test/graphql
```

- Must live inside `frontend/`, not the repo root — Next.js only auto-loads
  `.env*` files from its own project root.
- `NEXT_PUBLIC_` prefix is required for any variable read in the browser
  (Apollo Client's `HttpLink` runs client-side). Don't put secrets behind
  this prefix — they'd ship in the client bundle.
- Read through `lib/env.ts`, never `process.env` directly (see
  [architecture.md](architecture.md)). Missing required variables throw at
  startup instead of failing silently later.

## Project structure

See [architecture.md](architecture.md#folder-philosophy) for the full
folder layout and the reasoning behind it.

## Important commands

| Command         | Purpose                                  |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start the dev server                      |
| `npm run build` | Production build                          |
| `npm run start` | Run the production build                  |
| `npm run lint`  | ESLint (flat config, Next.js core-vitals) |

## Adding shadcn components

```bash
npx shadcn@latest add <component>
```

Installs into `components/ui/`, per `components.json`.

## Local development product data

The local WordPress/WooCommerce backend has no products by default. For
end-to-end verification against real data (rather than the `app/dev/*`
fixture pages), a small, deliberate dataset can be created with:

```bash
bash backend/dev-data/seed-products.sh
```

Creates 6 product categories and 8 products, each covering a specific
storefront scenario — a regular-price product, an on-sale product, a
4-image product (`ProductGallery`), a long-title/long-description product
(Detail hierarchy and responsive layout), and a sparse product with no
image or description (graceful empty-state rendering) — plus 3 more
products spread across the remaining categories for realistic
catalog/category/search/filter/sort coverage. Product images are simple
labeled placeholder PNGs generated locally via PHP's GD extension (no
external dependency) — see `backend/dev-data/generate-placeholder-image.php`.

Categories and image imports are checked before creating, so the script
is safe to re-run. Products are not (WooCommerce has no natural upsert
here) — to start over, delete existing products first:

```bash
wp post list --post_type=product --field=ID --allow-root | xargs -r wp post delete --force --allow-root
```

This is local development fixture data, not a seed mechanism for any
other environment — there's no equivalent for production or staging.
