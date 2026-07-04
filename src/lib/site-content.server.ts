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
const SITE_CONTENT_TIMEOUT_MS = 2_500;

function isProductionBuild() {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      work(controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("Site content request timed out"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function getSiteContent(): Promise<SiteContentSection[]> {
  let savedSections: ApiSection[] = [];

  try {
    const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) throw new Error("Backend URL is not configured");
    if (isProductionBuild()) throw new Error("Skip live site content during production build");

    const response = await withTimeout(
      (signal) =>
        fetch(`${backendUrl}/api/homePage/content`, {
          next: {
            revalidate: SITE_CONTENT_REVALIDATE_SECONDS,
            tags: ["site-content"],
          },
          signal,
        }),
      SITE_CONTENT_TIMEOUT_MS,
    );

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
