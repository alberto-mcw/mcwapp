import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { TeaserSection } from "@/components/TeaserSection";
import { TeamLeaderVote } from "@/components/TeamLeaderVote";
import { RegistrationSection } from "@/components/RegistrationSection";
import { EmotionalCounter } from "@/components/EmotionalCounter";
import { TeaserFooter } from "@/components/TeaserFooter";
import { useMobileRedirect } from "@/hooks/useMobileRedirect";

const Index = () => {
  useMobileRedirect();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <HeroSection />
        <TeaserSection />
        <TeamLeaderVote />
        <RegistrationSection />
        <EmotionalCounter />
        <TeaserFooter />
      </main>
    </div>
  );
};

export default Index;
