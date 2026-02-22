import { useState } from "react";
import { MasterChefLogo, Manopla } from "./MasterChefLogo";
import { Button } from "./ui/button";
import { ChevronRight, Play } from "lucide-react";

export const HeroSection = () => {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const scrollToRegistro = () => {
    document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToVote = () => {
    document.getElementById("vote")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-background px-4 py-20">
      {/* Glow background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-[10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-1/3 left-[5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/8 blur-[80px]" />
        {/* Subtle manopla in corner */}
        <div className="absolute top-24 right-8 md:right-16 opacity-[0.06] rotate-12">
          <Manopla className="w-32 h-32 md:w-48 md:h-48" />
        </div>
      </div>

      <div className="container relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="flex justify-center mb-10 animate-fade-in">
          <MasterChefLogo size="lg" />
        </div>

        {/* Badge */}
        <div className="mb-8 animate-slide-up">
          <span className="badge-primary text-[10px] md:text-xs">
            2026 · Teaser
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black mb-6 animate-slide-up text-foreground uppercase">
          Algo grande se está{" "}
          <span className="text-gradient-primary">cocinando</span>
        </h1>

        {/* Subheadline */}
        <p className="font-body text-base md:text-lg text-muted-foreground max-w-lg mx-auto mb-12 animate-slide-up stagger-1 leading-relaxed">
          La competición gastronómica vuelve en 2026.
          <br className="hidden sm:block" />
          Y esta vez empieza antes.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
          <Button
            onClick={scrollToRegistro}
            size="lg"
            className="btn-primary w-full sm:w-auto text-sm md:text-base px-8 py-6 group relative"
            onMouseEnter={() => setHoveredBtn("register")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Apúntate a El Reto 2026
            <ChevronRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            {hoveredBtn === "register" && (
              <span className="absolute -top-2 -right-2 animate-fade-in">
                <Manopla className="w-6 h-6 opacity-80" />
              </span>
            )}
          </Button>
          <Button
            onClick={scrollToVote}
            variant="outline"
            size="lg"
            className="btn-outline w-full sm:w-auto text-sm md:text-base px-8 py-6 group relative"
            onMouseEnter={() => setHoveredBtn("play")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Play className="mr-2 w-5 h-5" />
            Empieza a jugar
            {hoveredBtn === "play" && (
              <span className="absolute -top-2 -right-2 animate-fade-in">
                <Manopla className="w-6 h-6 opacity-80" />
              </span>
            )}
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in stagger-5">
          <span className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase">Descubre</span>
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex justify-center p-1.5">
            <div className="w-1 h-1.5 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};
