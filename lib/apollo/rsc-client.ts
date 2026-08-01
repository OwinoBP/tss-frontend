import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { createLinks } from "./links";

/**
 * Apollo access for React Server Components.
 *
 * Separate from client.ts/provider.tsx (the Client Component path): RSC
 * needs a client scoped to the current server request, reused across
 * components rendering within that request but never shared across
 * requests. `registerApolloClient` provides exactly that; `ApolloNextAppProvider`
 * solves a different problem (a browser singleton) and isn't safe to use
 * for this.
 */
export const { getClient, query } = registerApolloClient(() => {
  return new ApolloClient({
    link: createLinks(),
    cache: new InMemoryCache(),
  });
});
