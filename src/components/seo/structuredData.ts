import type { JsonLdData } from "./JsonLd";

/**
 * Site-wide identity used by every JSON-LD node.
 * Edit the values here once and the Organization / WebSite schemas
 * (and any future node that references them) stay in sync.
 */
export const SITE = {
  name: "Nexora",
  shortName: "Nexora",
  description:
    "Where Knowledge Meets Mentorship. Nexora is a learning platform built for researchers, teachers, and the curious — with clusters, sessions, resources, and courses.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://nexora.com",
  logo: "/images/logo/nexora-logo.svg",
  // SameAs entries feed the Organization "sameAs" graph (Wikipedia, social, Crunchbase, etc.).
  // Leave empty until real profiles exist — the field is omitted from output when none are set.
  socialSameAs: [] as string[],
  contactEmail: "hello@nexora.com",
};

/** Build the Organization + WebSite graph emitted from the root layout. */
export function buildSiteGraph(): JsonLdData {
  const organization: JsonLdData = {
    "@type": "Organization",
    "@id": `${SITE.url}#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: `${SITE.url}${SITE.logo}`,
    },
    description: SITE.description,
    email: SITE.contactEmail,
    ...(SITE.socialSameAs.length ? { sameAs: SITE.socialSameAs } : {}),
  };

  const website: JsonLdData = {
    "@type": "WebSite",
    "@id": `${SITE.url}#website`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE.url,
    description: SITE.description,
    publisher: { "@id": `${SITE.url}#organization` },
    inLanguage: "en",
    // Sitelinks Search Box — Google may render a search box for the homepage
    // when this SearchAction target points at a working search URL.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/courses?search={search_term_string}`,
      },
      // `query-input` must use the literal string "required name=search_term_string"
      "query-input": "required name=search_term_string",
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website],
  };
}