import {
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { createLinks } from "./links";
import { env } from "@/lib/env";

/**
 * Creates an Apollo Client instance.
 *
 * This is the `makeClient` factory passed to `ApolloNextAppProvider`
 * (see provider.tsx). The App Router renders on the server per-request, so a
 * single shared client instance can't be reused there — a factory is needed
 * to create one per request. `ApolloNextAppProvider` takes care of reusing a
 * true singleton in the browser once the app hydrates, which is what makes
 * this pattern safe for SSR while still behaving like a singleton client-side.
 */
export function createApolloClient(): ApolloClient {
  return new ApolloClient({
    link: createLinks(),
    cache: new InMemoryCache(),
    devtools: {
      enabled: env.isDevelopment,
    },
  });
}
