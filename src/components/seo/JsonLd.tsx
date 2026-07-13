/**
 * Drop-in server component for emitting JSON-LD structured data.
 *
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", ... }} />
 *
 * For multiple nodes (e.g. WebSite + Organization), pass an `@graph` array:
 *   <JsonLd data={{ "@context": "https://schema.org", "@graph": [org, site] }} />
 *
 * The data type is intentionally loose — schema.org allows arbitrary
 * properties and we want to support any vocabulary (Organization, WebSite,
 * Course, FAQPage, BreadcrumbList, etc.) without a schema-dts dependency.
 */
export type JsonLdData = {
  "@context"?: "https://schema.org";
  "@type"?: string;
  "@graph"?: JsonLdData[];
  [key: string]: unknown;
};

export default function JsonLd({
  data,
  id,
}: {
  data: JsonLdData;
  id?: string;
}) {
  return (
    <script
      type="application/ld+json"
      id={id}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
