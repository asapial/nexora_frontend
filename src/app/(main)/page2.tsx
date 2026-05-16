
import BannerSection from '@/components/home/BannerSection'
import CoursesSection from '@/components/home/CoursesSection'
import CtaSection from '@/components/home/CtaSection'
import FaqSection from '@/components/home/FaqSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import HeroSection from '@/components/home/HeroSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import RolesSection from '@/components/home/RolesSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'



export default function page() {
  return (

    <div>
      <HeroSection></HeroSection>
      <CoursesSection></CoursesSection>
      <FeaturesSection></FeaturesSection>
      <HowItWorksSection></HowItWorksSection>
      <RolesSection></RolesSection>
      {/* <BannerSection></BannerSection> */}
      <TestimonialsSection></TestimonialsSection>
      <FaqSection></FaqSection>
      <CtaSection></CtaSection>
    </div>
  )
}
