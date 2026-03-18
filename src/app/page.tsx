
import FeaturesSection from '@/components/home/FeaturesSection'
import HeroSection from '@/components/home/HeroSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import SectionContainer from '@/utils/SectionContainer'
import React from 'react'

export default function page() {
  return (

    <div>
      <HeroSection></HeroSection>
      <FeaturesSection></FeaturesSection>
      <HowItWorksSection></HowItWorksSection>
    </div>
  )
}
