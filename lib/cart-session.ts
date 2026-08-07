import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * The WooCommerce guest-cart session token (see docs/decisions.md, "Cart")
 * lives in an httpOnly cookie — not `localStorage`, so a Server Component
 * (e.g. `app/cart/page.tsx`) can read the current cart at render time, and
 * not client-readable, since nothing in the client bundle ever needs to see
 * the raw token (every mutation goes through a Server Action).
 */
const CART_SESSION_COOKIE = "woo_cart_session";

/** Readable from a Server Component or a Server Action. */
export async function getCartSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_SESSION_COOKIE)?.value ?? null;
}

/**
 * Writable only from a Server Action/Route Handler (Next.js constraint —
 * `.set()` throws during a Server Component render). Called after every
 * cart mutation with the fresh token WooCommerce returns, since it can
 * rotate on each request.
 */
export async function setCartSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(CART_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    // WooCommerce's own session JWT already carries a ~2-day expiry
    // (confirmed live — see docs/decisions.md, "Cart"); mirroring that
    // here rather than a longer arbitrary value keeps the cookie from
    // outliving the token it stores.
    maxAge: 60 * 60 * 48,
  });
}
