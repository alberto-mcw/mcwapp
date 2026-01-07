import { MasterChefLogo, Manopla } from "./MasterChefLogo";
import { Button } from "./ui/button";
import { Download, ChevronRight } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-dark px-4 py-20">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/5" />
      </div>

      <div className="container relative z-10 max-w-6xl mx-auto">
        {/* Logo and Badge */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <MasterChefLogo size="lg" />
            <Manopla className="w-16 h-16 animate-float" />
          </div>
          <span className="badge-fire">
            TEMPORADA 2 · 2026
          </span>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight mb-4 animate-slide-up">
            <span className="text-gradient-fire">COMPITE.</span>{" "}
            <span className="text-foreground">CREA.</span>{" "}
            <span className="text-gradient-fire">GANA ENERGÍA.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto animate-slide-up stagger-1">
            El mayor reto culinario digital vuelve en 2026
          </p>
        </div>


        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
          <Button 
            size="lg" 
            className="btn-fire w-full sm:w-auto text-base px-8 py-6 rounded-xl"
          >
            APÚNTATE AL RETO 2026
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            variant="outline"
            size="lg" 
            className="btn-ghost w-full sm:w-auto text-base px-8 py-6 rounded-xl"
          >
            <Download className="mr-2 w-5 h-5" />
            DESCARGAR LA APP
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in stagger-5">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Descubre más</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center p-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};
