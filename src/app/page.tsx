import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { SocialProof } from '@/components/home/SocialProof';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SocialProof />
      <FeaturesSection />
      <HowItWorks />
    </>
  );
}
