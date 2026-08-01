import { query } from "@/lib/apollo/rsc-client";
import { SITE_INFO_QUERY } from "@/graphql/queries/site-info";

export interface SiteInfo {
  title: string;
  description: string;
  url: string;
}

/**
 * Fetches WordPress's general site settings over GraphQL.
 *
 * The only place this app calls Apollo's `query` directly — components
 * import `getSiteInfo`, not the query or the client.
 */
export async function getSiteInfo(): Promise<SiteInfo> {
  const { data } = await query({ query: SITE_INFO_QUERY, errorPolicy: "none" });
  return data.generalSettings;
}
