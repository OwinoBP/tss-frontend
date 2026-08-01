"use client";

import { ApolloNextAppProvider } from "@apollo/client-integration-nextjs";
import { createApolloClient } from "./client";

/**
 * Wraps the app with Apollo Client, App Router–aware.
 *
 * Mounted once in the root layout. Works even though the layout itself is a
 * Server Component — this provider is the client-side boundary that makes
 * the Apollo Client instance available to every Client Component below it.
 */
export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={createApolloClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
