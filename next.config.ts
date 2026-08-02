import type { NextConfig } from "next";

/**
 * `next/image` refuses to load from any host not explicitly allow-listed.
 * Product artwork (ProductCard) is served by the same WordPress backend
 * GraphQL is read from, so the allowed host is derived from
 * `NEXT_PUBLIC_GRAPHQL_ENDPOINT` rather than a second hardcoded domain —
 * one source of truth for "where the backend lives." Falls back to no
 * remote patterns (rather than throwing) if the variable is missing or
 * malformed, since `lib/env.ts` — not this file — is where that's
 * validated for the app itself; a build shouldn't hard-crash over it here.
 */
function backendRemotePattern(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    return [];
  }
  try {
    const url = new URL(endpoint);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: backendRemotePattern(),
  },
};

export default nextConfig;
