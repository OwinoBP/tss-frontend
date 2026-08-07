import { ApolloLink } from "@apollo/client";
import { map } from "rxjs";

/**
 * Manages the WooCommerce/WPGraphQL guest-cart session round trip through
 * Apollo Client rather than bypassing Apollo for a raw `fetch()`.
 *
 * WPGraphQL is stateless — cart-touching requests return a `woocommerce-session`
 * response header (a JWT) that must be echoed back as a request header on
 * the next call to keep addressing the same guest cart (confirmed live via
 * direct `curl` and independently spiked through this exact link mechanism
 * against the real backend — see docs/decisions.md, "Cart"). Apollo's
 * `HttpLink` exposes the raw `Response` on `operation.getContext().response`
 * once a request resolves, so a link positioned before `HttpLink` can read
 * the incoming header the same way it can set the outgoing one — no
 * response header is available through `client.query()`/`client.mutate()`'s
 * own return value, so a mutable `sessionOut` holder passed via `context` is
 * the only way to surface it back to the caller.
 *
 * Deliberately a link used only by the cart-scoped client (`cart-client.ts`),
 * not merged into the base `createLinks()` chain every product/category
 * query goes through — those never touch a session token.
 */
export function createSessionLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const { sessionToken, sessionOut } = operation.getContext() as {
      sessionToken?: string | null;
      sessionOut?: { token?: string };
    };

    if (sessionToken) {
      operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
        headers: { ...headers, "woocommerce-session": `Session ${sessionToken}` },
      }));
    }

    return forward(operation).pipe(
      map((result) => {
        const response = operation.getContext().response as Response | undefined;
        const header = response?.headers?.get("woocommerce-session");
        if (header && sessionOut) {
          sessionOut.token = header;
        }
        return result;
      }),
    );
  });
}
