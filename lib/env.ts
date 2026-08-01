/**
 * Typed access to environment variables.
 *
 * The rest of the app should import `env` from here instead of reading
 * `process.env` directly, so required variables are validated in one place
 * and every consumer gets a typed value.
 *
 * Only `NEXT_PUBLIC_*` (client-safe) variables belong here. Server-only
 * secrets (e.g. WooCommerce API keys) should get their own server-only
 * module once they're introduced, so they can never end up in a client
 * bundle.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  graphqlEndpoint: requireEnv(
    "NEXT_PUBLIC_GRAPHQL_ENDPOINT",
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  ),
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;
