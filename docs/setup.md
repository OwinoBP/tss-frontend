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
