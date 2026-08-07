import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { createSessionLink } from "./session-link";
import { env } from "@/lib/env";

/**
 * A third, purpose-built Apollo Client — alongside `client.ts` (browser)
 * and `rsc-client.ts` (per-request RSC reads) — for cart operations
 * specifically. Cart calls are session-scoped mutations/reads that should
 * never be cached or deduped the way `rsc-client.ts`'s `registerApolloClient`
 * memoizes reads within a request; every cart call is meant to hit the
 * network fresh (`fetchPolicy: "no-cache"` at the call site). A plain
 * factory, created fresh per call from `cart.service.ts` rather than a
 * request-scoped singleton, is simpler and avoids that memoization
 * machinery for a client that only ever runs one-off operations. See
 * docs/decisions.md, "Cart".
 */
export function createCartClient(): ApolloClient {
  return new ApolloClient({
    link: ApolloLink.from([createSessionLink(), new HttpLink({ uri: env.graphqlEndpoint })]),
    cache: new InMemoryCache(),
  });
}
