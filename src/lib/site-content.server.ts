import "server-only";

import {
  SITE_CONTENT_CATALOG,
  type SiteContentSection,
  type SiteContentValue,
} from "@/content/site-content";

interface ApiSection {
  key: string;
  content: Record<string, SiteContentValue>;
  isVisible: boolean;
  order: number;
}

export const SITE_CONTENT_REVALIDATE_SECONDS = 600;

export async function getSiteContent(): Promise<SiteContentSection[]> {
  let savedSections: ApiSection[] = [];

  try {
    const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) throw new Error("Backend URL is not configured");

    const response = await fetch(`${backendUrl}/api/homePage/content`, {
      next: {
        revalidate: SITE_CONTENT_REVALIDATE_SECONDS,
        tags: ["site-content"],
      },
    });

    if (!response.ok) throw new Error("Could not load site content");
    const payload = await response.json();
    savedSections = Array.isArray(payload.data) ? payload.data : [];
  } catch {
    savedSections = [];
  }

  const savedByKey = new Map(savedSections.map((section) => [section.key, section]));

  return SITE_CONTENT_CATALOG.map((fallback) => {
    const saved = savedByKey.get(fallback.key);
    return {
      ...fallback,
      content: saved?.content ?? fallback.content,
      isVisible: saved?.isVisible ?? fallback.isVisible,
      order: saved?.order ?? fallback.order,
    };
  }).sort((a, b) => a.order - b.order);
}

export async function getSiteContentSection(key: string) {
  const sections = await getSiteContent();
  return sections.find((section) => section.key === key);
}
