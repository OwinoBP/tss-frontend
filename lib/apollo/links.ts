import { HttpLink, type ApolloLink } from "@apollo/client";
import { env } from "@/lib/env";

/**
 * Builds the Apollo Link chain used by the client.
 *
 * Kept separate from client.ts so network concerns — auth headers, logging,
 * retries, error handling — can be added here later (via `ApolloLink.from`)
 * without touching client or provider setup.
 */
export function createLinks(): ApolloLink {
  return new HttpLink({
    uri: env.graphqlEndpoint,
  });
}
