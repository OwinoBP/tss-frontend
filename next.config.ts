import type { NextConfig } from "next";

/**
 * `next/image` refuses to load from any host not explicitly allow-listed.
 * Product artwork (ProductCard, ProductGallery) is served by the same
 * WordPress backend GraphQL is read from, so the allowed host is derived
 * from `NEXT_PUBLIC_GRAPHQL_ENDPOINT` rather than a second hardcoded
 * domain — one source of truth for "where the backend lives." Falls back
 * to no remote patterns (rather than throwing) if the variable is missing
 * or malformed, since `lib/env.ts` — not this file — is where that's
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
  /**
   * Next.js blocks cross-origin requests to dev-only assets/endpoints
   * (`/_next/static/*`, `/_next/webpack-hmr`) by default — confirmed live
   * as the actual cause of both the Add to Cart failure and the HMR
   * WebSocket errors when this dev server is exposed through the current
   * Cloudflare Quick Tunnel session: the tunnel's origin isn't `localhost`,
   * so those requests were rejected with 403 "Unauthorized" before React
   * ever hydrated (see docs/decisions.md). This is the literal, currently
   * active Quick Tunnel hostname for this demo session only — Quick
   * Tunnel hostnames are randomly regenerated on every `cloudflared`
   * restart, so this needs updating (or removing) whenever the tunnel URL
   * changes; not a permanent or production concern (`next build`/`next
   * start` don't have this dev-only guard at all).
   */
  allowedDevOrigins: ["sept-kelly-violation-ministry.trycloudflare.com"],
  images: {
    remotePatterns: backendRemotePattern(),
    /**
     * Next.js 16 added an SSRF-protection default that refuses to
     * optimize any image whose host resolves to a private/loopback IP —
     * confirmed against this project's own local WordPress backend
     * (`tss.maabara.local` resolves to `127.0.0.1`), which the image
     * optimizer rejected with "upstream image ... resolved to private ip"
     * until this was set (see docs/decisions.md). Scoped to development
     * only: production's backend is a real public domain that would never
     * resolve to a private IP, so production keeps the SSRF protection
     * this flag exists to provide — enabling it unconditionally would
     * weaken production for a problem production doesn't have.
     */
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
