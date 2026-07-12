import CoursesSection, { type CoursesSectionData } from "@/components/home/CoursesSection";
import CtaSection, { type CtaSectionData } from "@/components/home/CtaSection";
import FaqSection, { type FaqItem, type FaqSectionData, DEFAULT_ITEMS } from "@/components/home/FaqSection";
import FeaturesSection, { type FeaturesSectionData } from "@/components/home/FeaturesSection";
import HeroSection2, { type HeroSectionData } from "@/components/home/HeroSection2";
import HowItWorksSection, { type HowItWorksSectionData } from "@/components/home/HowItWorksSection";
import RolesSection, { type RolesSectionData } from "@/components/home/RolesSection";
import TestimonialsSection, { type TestimonialsSectionData } from "@/components/home/TestimonialsSection";
import { getSiteContent } from "@/lib/site-content.server";
import JsonLd from "@/components/seo/JsonLd";
import { SITE } from "@/components/seo/structuredData";

// Safety-net background refresh every 30 s.
// Primary invalidation is on-demand via /api/revalidate → revalidateTag("site-content")
// triggered by the admin editor immediately after each save.
export const revalidate = 30;

export default async function HomePage() {
  const sections = (await getSiteContent()).filter(
    (section) => section.group === "Homepage" && section.isVisible,
  );

  // Build a FAQPage JSON-LD node from the live FAQ items so search engines
  // can render rich FAQ results. Falls back to the bundled defaults when
  // the section is hidden or empty.
  const faqSection = sections.find((section) => section.key === "home-faq");
  const faqItems =
    (faqSection?.content as { items?: FaqItem[] } | undefined)?.items ??
    DEFAULT_ITEMS;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE.url}/#faq`,
    url: `${SITE.url}/#faq`,
    name: `${SITE.name} — Frequently Asked Questions`,
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div>
      <JsonLd id="ld-faq" data={faqJsonLd} />
      {sections.map((section) => {
        switch (section.key) {
          case "home-hero":
            return <HeroSection2 key={section.key} data={section.content as unknown as HeroSectionData} />;
          case "home-courses":
            return <CoursesSection key={section.key} data={section.content as unknown as CoursesSectionData} />;
          case "home-features":
            return <FeaturesSection key={section.key} data={section.content as unknown as FeaturesSectionData} />;
          case "home-how-it-works":
            return <HowItWorksSection key={section.key} data={section.content as unknown as HowItWorksSectionData} />;
          case "home-roles":
            return <RolesSection key={section.key} data={section.content as unknown as RolesSectionData} />;
          case "home-testimonials":
            return <TestimonialsSection key={section.key} data={section.content as unknown as TestimonialsSectionData} />;
          case "home-faq": {
            const content = section.content as unknown as FaqSectionData & { items: FaqItem[] };
            return <FaqSection key={section.key} data={content} items={content.items} />;
          }
          case "home-cta":
            return <CtaSection key={section.key} data={section.content as unknown as CtaSectionData} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
