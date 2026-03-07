import { Zap, TrendingUp, Battery } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Todo suma",
    description: "Cada acción cuenta. Cada reto completado. Cada interacción."
  },
  {
    icon: TrendingUp,
    title: "No empiezas de cero",
    description: "Tu progreso se acumula. Entra antes y empieza con ventaja."
  },
  {
    icon: Battery,
    title: "Los puntos se conservan",
    description: "Lo que construyes hoy te impulsa mañana. Sin resets."
  }
];

export const WhatIsSection = () => {
  return (
    <section className="relative py-20 px-4 bg-background">
      <div className="container max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="badge-primary mb-4 inline-block">El reto</span>
          <h2 className="section-title mb-4">
            ¿Qué es <span className="text-gradient-primary">El Reto</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No es un casting puntual.{" "}
            <span className="text-foreground font-semibold">
              Es un recorrido progresivo.
            </span>
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-panel text-center transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 glow-warm">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
