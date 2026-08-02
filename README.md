# TSS — Music Marketplace (Frontend)

A production-ready headless WooCommerce music marketplace, inspired by The
Sample Select.

- **Client:** TSS
- **Development lab:** Maabara
- **Company:** Ujao Defined

This package is the Next.js frontend. WordPress/WooCommerce (`../backend`)
is a separate, headless backend reachable only through GraphQL — see
[docs/architecture.md](docs/architecture.md).

## Tech stack

**Frontend**

- Next.js (App Router) + TypeScript
- Apollo Client (`@apollo/client-integration-nextjs` for App Router support)
- Tailwind CSS v4 + shadcn/ui + Radix UI
- ESLint (flat config)

**Backend**

- WordPress + WooCommerce
- WPGraphQL + WPGraphQL for WooCommerce
- MariaDB
- Nginx

## Architecture

```
┌─────────────────────┐        GraphQL         ┌──────────────────────────┐
│   Next.js frontend   │ ─────────────────────> │      WordPress admin      │
│   (this project)     │ <───────────────────── │   WooCommerce + WPGraphQL │
└─────────────────────┘                         └──────────────────────────┘

React Components → Services → Apollo Client → GraphQL → WordPress
```

Full write-up, including why components never call GraphQL directly:
[docs/architecture.md](docs/architecture.md) and [docs/decisions.md](docs/decisions.md).

## Development workflow

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

Requires `frontend/.env.local` with `NEXT_PUBLIC_GRAPHQL_ENDPOINT` set to
the WPGraphQL endpoint. Full setup: [docs/setup.md](docs/setup.md).

## Folder structure

```
app/            routing only — pages, layouts, route handlers
components/
  ui/           shadcn primitives
  layout/       header, footer, nav (created on first use)
  commerce/     cart, checkout, pricing UI (created on first use)
  music/        player, track list UI (created on first use)
  marketing/    landing/promo sections (created on first use)
  common/       shared, feature-agnostic UI (created on first use)
lib/
  apollo/       Apollo Client setup (client, provider, links)
  env.ts        typed environment access
graphql/        GraphQL documents — queries/, mutations/, fragments/
services/       the only layer that calls Apollo Client
hooks/          shared React hooks (created on first use)
types/          shared TypeScript types (created on first use)
data/           static/config data (created on first use)
```

Folders are created when their first real file lands, not scaffolded
empty in advance. Details: [docs/architecture.md](docs/architecture.md#folder-philosophy).

## Documentation

- [docs/architecture.md](docs/architecture.md) — system architecture, GraphQL flow, service layer
- [docs/setup.md](docs/setup.md) — local dev setup, env vars, commands
- [docs/decisions.md](docs/decisions.md) — why each major technology and pattern was chosen
- [docs/product-model.md](docs/product-model.md) — the canonical `MusicProduct` domain model
- [docs/api/product-query.md](docs/api/product-query.md) — the first real product query, field by field
- [docs/design-system.md](docs/design-system.md) — the visual language: typography, color, spacing, layout, and more
- [docs/component-principles.md](docs/component-principles.md) — architectural rules for UI components

## Roadmap

- [x] Project architecture review
- [x] Apollo Client + GraphQL infrastructure
- [x] Canonical `MusicProduct` domain model
- [x] First GraphQL query (`graphql/queries/products.query.ts`) and `product.service.ts` implementation
- [x] Design system and component principles documentation
- [x] Centralized configuration layer (`lib/config`)
- [x] Layout foundation and application shell (`components/layout`)
- [ ] Product listing and detail pages
- [ ] Cart and checkout flow
- [ ] Audio player / music browsing UI
- [ ] Search
- [ ] Authentication (customer accounts)
