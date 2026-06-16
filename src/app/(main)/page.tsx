import CoursesSection, { type CoursesSectionData } from "@/components/home/CoursesSection";
import CtaSection, { type CtaSectionData } from "@/components/home/CtaSection";
import FaqSection, { type FaqItem, type FaqSectionData } from "@/components/home/FaqSection";
import FeaturesSection, { type FeaturesSectionData } from "@/components/home/FeaturesSection";
import HeroSection2, { type HeroSectionData } from "@/components/home/HeroSection2";
import HowItWorksSection, { type HowItWorksSectionData } from "@/components/home/HowItWorksSection";
import RolesSection, { type RolesSectionData } from "@/components/home/RolesSection";
import TestimonialsSection, { type TestimonialsSectionData } from "@/components/home/TestimonialsSection";
import { getSiteContent } from "@/lib/site-content.server";

// Safety-net background refresh every 30 s.
// Primary invalidation is on-demand via /api/revalidate → revalidateTag("site-content")
// triggered by the admin editor immediately after each save.
export const revalidate = 30;

export default async function HomePage() {
  const sections = (await getSiteContent()).filter(
    (section) => section.group === "Homepage" && section.isVisible,
  );

  return (
    <div>
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
