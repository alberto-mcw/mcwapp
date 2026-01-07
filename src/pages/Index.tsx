import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { WhatIsSection } from "@/components/WhatIsSection";
import { TimelineSection } from "@/components/TimelineSection";
import { EnergySection } from "@/components/EnergySection";
import { RankingSection } from "@/components/RankingSection";
import { ExperiencesSection } from "@/components/ExperiencesSection";
import { AppSection } from "@/components/AppSection";
import { RegistrationSection } from "@/components/RegistrationSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <HeroSection />
        <WhatIsSection />
        <TimelineSection />
        <EnergySection />
        <RankingSection />
        <ExperiencesSection />
        <AppSection />
        <RegistrationSection />
        <Footer />
      </main>
    </div>
  );
};

export default Index;
