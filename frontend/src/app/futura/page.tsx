import { HeroSection } from '@/components/futura/HeroSection';
import { AboutSection } from '@/components/futura/AboutSection';
import { DifferenceSection } from '@/components/futura/DifferenceSection';
import { IndustriesSection } from '@/components/futura/IndustriesSection';
import { ServicesSection } from '@/components/futura/ServicesSection';
import { VerticalTab } from '@/components/futura/VerticalTab';

export default function FuturaHomePage() {
  return (
    <div className="futura-root relative w-full bg-white text-[var(--ink)]">
      <VerticalTab />
      <HeroSection />
      <AboutSection />
      <DifferenceSection />
      <IndustriesSection />
      <ServicesSection />
    </div>
  );
}
