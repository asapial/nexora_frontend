import { notFound } from "next/navigation";

import SiteContentEditor from "@/components/admin/SiteContentEditor";
import { SITE_CONTENT_BY_KEY } from "@/content/site-content";

export default async function SiteContentSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: sectionKey } = await params;
  const section = SITE_CONTENT_BY_KEY[sectionKey];
  if (!section) notFound();

  return <SiteContentEditor section={section} />;
}
