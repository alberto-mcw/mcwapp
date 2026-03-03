import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FireCircle } from "@/components/FireCircle";
import { Smartphone, Zap, Trophy, Users, Bell, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Sistema de Energía",
    description: "Acumula energía completando retos y escalando posiciones.",
  },
  {
    icon: Trophy,
    title: "Ranking en Vivo",
    description: "Sigue tu posición en tiempo real contra miles de participantes.",
  },
  {
    icon: Users,
    title: "Comunidad Activa",
    description: "Conecta con otros aspirantes y comparte tu pasión.",
  },
  {
    icon: Bell,
    title: "Notificaciones",
    description: "Recibe avisos de retos, eventos y oportunidades.",
  },
  {
    icon: Video,
    title: "Directos Exclusivos",
    description: "Accede a contenido en vivo con chefs profesionales.",
  },
];

const Descarga = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="relative inline-block mb-8">
              <FireCircle size="xl" intensity="high" className="absolute -inset-8" />
              <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center glow-fire">
                <Smartphone className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="font-unbounded text-4xl md:text-6xl font-black uppercase mb-4">
              Descarga la<br />
              <span className="text-gradient">App Oficial</span>
            </h1>
            
            <p className="text-muted-foreground max-w-xl mx-auto mb-4">
              Para completar la <strong>Fase 0 (vídeo casting)</strong> necesitas la App móvil. 
              La web no permite acceso a cámara y micrófono.
            </p>
            <p className="text-sm text-primary font-medium mb-8">
              📱 Descarga la app → Graba tu vídeo → Empieza a competir
            </p>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <a href="#" className="transition-transform hover:scale-105">
                <img 
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                  alt="Download on App Store" 
                  className="h-14"
                />
              </a>
              <a href="#" className="transition-transform hover:scale-105">
                <img 
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                  alt="Get it on Google Play" 
                  className="h-14"
                />
              </a>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Disponible para iOS y Android · Gratis
            </p>
          </div>

          {/* Features Grid */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="font-unbounded text-2xl font-bold text-center mb-8">
              Todo lo que necesitas
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* App Preview */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-gradient-to-b from-primary/20 to-transparent rounded-3xl p-8 md:p-12">
              <div className="relative inline-block">
                <div className="w-64 md:w-80 h-[500px] md:h-[600px] bg-card border-4 border-foreground/20 rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-b from-background to-secondary flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-unbounded text-lg font-bold mb-2">MasterChef World</p>
                    <p className="text-sm text-muted-foreground mb-8">El Reto 2026</p>
                    
                    <div className="w-full space-y-3">
                      <div className="bg-secondary/80 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20" />
                        <div className="flex-1">
                          <div className="h-3 bg-primary/20 rounded w-24 mb-1" />
                          <div className="h-2 bg-muted rounded w-16" />
                        </div>
                        <div className="text-xs font-bold text-primary">24.5K</div>
                      </div>
                      <div className="bg-secondary/80 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20" />
                        <div className="flex-1">
                          <div className="h-3 bg-primary/20 rounded w-20 mb-1" />
                          <div className="h-2 bg-muted rounded w-12" />
                        </div>
                        <div className="text-xs font-bold text-primary">22.3K</div>
                      </div>
                      <div className="bg-secondary/80 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20" />
                        <div className="flex-1">
                          <div className="h-3 bg-primary/20 rounded w-28 mb-1" />
                          <div className="h-2 bg-muted rounded w-14" />
                        </div>
                        <div className="text-xs font-bold text-primary">21.8K</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="mt-8 text-muted-foreground">
                Interfaz intuitiva · Actualizaciones constantes · Soporte 24/7
              </p>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <h2 className="font-unbounded text-2xl font-bold mb-4">
              ¿A qué esperas?
            </h2>
            <p className="text-muted-foreground mb-6">
              Cuanto antes entres, más energía acumulas
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href="/#registro">
                <Zap className="w-5 h-5" />
                Apúntate al Reto
              </a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Descarga;
