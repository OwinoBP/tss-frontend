import { gql, type TypedDocumentNode } from "@apollo/client";

export interface SiteInfoQueryData {
  generalSettings: {
    title: string;
    description: string;
    url: string;
  };
}

export const SITE_INFO_QUERY: TypedDocumentNode<SiteInfoQueryData> = gql`
  query SiteInfo {
    generalSettings {
      title
      description
      url
    }
  }
`;
