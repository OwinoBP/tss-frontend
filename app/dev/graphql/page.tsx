import { getSiteInfo, type SiteInfo } from "@/services/site.service";

/**
 * Temporary page to verify the Apollo Client -> WPGraphQL -> WordPress
 * chain works end to end. Not linked from the app; safe to delete once
 * real pages exercise the same infrastructure.
 */
export default async function GraphQLDevPage() {
  let siteInfo: SiteInfo | null = null;
  let errorMessage: string | null = null;

  try {
    siteInfo = await getSiteInfo();
  } catch (cause) {
    errorMessage = cause instanceof Error ? cause.message : "Unknown error";
  }

  if (!siteInfo) {
    return (
      <main style={{ padding: 24, fontFamily: "monospace" }}>
        <h1>GraphQL Not Connected</h1>
        <p>{errorMessage}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>GraphQL Connected</h1>
      <p>
        <strong>Title:</strong> {siteInfo.title}
      </p>
      <p>
        <strong>Description:</strong> {siteInfo.description}
      </p>
      <p>
        <strong>URL:</strong> {siteInfo.url}
      </p>
    </main>
  );
}
