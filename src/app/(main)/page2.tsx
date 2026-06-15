import CoursesSection, { type CoursesSectionData } from "@/components/home/CoursesSection";
import CtaSection, { type CtaSectionData } from "@/components/home/CtaSection";
import FaqSection, { type FaqItem, type FaqSectionData } from "@/components/home/FaqSection";
import FeaturesSection, { type FeaturesSectionData } from "@/components/home/FeaturesSection";
import HeroSection from "@/components/home/HeroSection";
import HowItWorksSection, { type HowItWorksSectionData } from "@/components/home/HowItWorksSection";
import RolesSection, { type RolesSectionData } from "@/components/home/RolesSection";
import TestimonialsSection, { type TestimonialsSectionData } from "@/components/home/TestimonialsSection";
import { SITE_CONTENT_BY_KEY } from "@/content/site-content";

export default function Page2() {
  const courses = SITE_CONTENT_BY_KEY["home-courses"].content as unknown as CoursesSectionData;
  const features = SITE_CONTENT_BY_KEY["home-features"].content as unknown as FeaturesSectionData;
  const howItWorks = SITE_CONTENT_BY_KEY["home-how-it-works"].content as unknown as HowItWorksSectionData;
  const roles = SITE_CONTENT_BY_KEY["home-roles"].content as unknown as RolesSectionData;
  const testimonials = SITE_CONTENT_BY_KEY["home-testimonials"].content as unknown as TestimonialsSectionData;
  const faq = SITE_CONTENT_BY_KEY["home-faq"].content as unknown as FaqSectionData & { items: FaqItem[] };
  const cta = SITE_CONTENT_BY_KEY["home-cta"].content as unknown as CtaSectionData;

  return (
    <div>
      <HeroSection />
      <CoursesSection data={courses} />
      <FeaturesSection data={features} />
      <HowItWorksSection data={howItWorks} />
      <RolesSection data={roles} />
      <TestimonialsSection data={testimonials} />
      <FaqSection data={faq} items={faq.items} />
      <CtaSection data={cta} />
    </div>
  );
}
