import { Button } from "./ui/button";
import { Zap, Bell, Radio, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Trophy, label: "Ranking en vivo" },
  { icon: Zap, label: "Tus puntos" },
  { icon: Bell, label: "Avisos instantáneos" },
  { icon: Radio, label: "Directos exclusivos" },
];

export const AppSection = () => {
  return (
    <section className="relative py-20 px-4 bg-card overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-primary/3" />
      </div>

      <div className="container max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center md:text-left">
            <span className="badge-primary mb-4 inline-block">La app</span>
            <h2 className="section-title mb-4">
              Todo vive en <span className="text-gradient-primary">la app</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Tu centro de mando para El Reto. Ranking, puntos, avisos, directos... 
              Todo en un solo lugar.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border border-border"
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild className="btn-primary px-8 py-6 text-base">
                <Link to="/descarga">
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  App Store
                </Link>
              </Button>
              <Button asChild className="btn-outline px-8 py-6 text-base">
                <Link to="/descarga">
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  Google Play
                </Link>
              </Button>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="relative flex justify-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
              
              {/* Phone frame */}
              <div className="relative bg-background border-4 border-muted rounded-[3rem] p-2 glow-warm">
                <div className="bg-card rounded-[2.5rem] overflow-hidden w-64 h-[520px]">
                  {/* Status bar */}
                  <div className="bg-muted/50 h-8 flex items-center justify-center">
                    <div className="w-20 h-4 bg-muted rounded-full" />
                  </div>
                  
                  {/* App content mockup */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">El Reto</span>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    
                    {/* Energy display */}
                    <div className="bg-muted/50 rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Tu energía</span>
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-2xl font-black text-primary">12,450</span>
                      <div className="h-2 bg-muted rounded-full mt-2">
                        <div className="h-full w-2/3 bg-gradient-primary rounded-full" />
                      </div>
                    </div>
                    
                    {/* Ranking preview */}
                    <div className="bg-muted/50 rounded-xl p-3 border border-border">
                      <div className="text-xs text-muted-foreground mb-2">Ranking</div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <span className="text-xs font-bold text-primary w-4">{i}</span>
                          <div className="flex-1 h-2 bg-muted rounded" />
                          <span className="text-xs text-muted-foreground">---</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quick action */}
                    <div className="bg-gradient-primary rounded-xl p-3 text-center">
                      <span className="text-sm font-bold text-primary-foreground">Reto del día</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
