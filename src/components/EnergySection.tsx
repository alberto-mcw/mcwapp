import { Zap, Users, Calendar, Radio, Gift } from "lucide-react";

const energySources = [
  { icon: Calendar, label: "Mini retos diarios", value: "+50" },
  { icon: Users, label: "Interacción comunidad", value: "+25" },
  { icon: Zap, label: "Desafíos semanales", value: "+200" },
  { icon: Radio, label: "Directos", value: "+100" },
  { icon: Gift, label: "Donación de energía", value: "±∞" },
];

export const EnergySection = () => {
  return (
    <section className="relative py-20 px-4 bg-background overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="badge-primary mb-4 inline-block">Sistema</span>
          <h2 className="section-title mb-4">
            <span className="text-gradient-primary">Puntos</span> = poder
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Los puntos no se regalan.{" "}
            <span className="text-foreground font-bold">Se genera.</span>
          </p>
        </div>

        {/* Energy Display */}
        <div className="relative max-w-2xl mx-auto mb-12">
          <div className="feature-panel p-6 md:p-8">
            {/* Energy Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold tracking-wider text-muted-foreground">Tus puntos</span>
                <span className="ranking-number text-2xl md:text-3xl font-black">
                  12,450
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div 
                  className="energy-bar h-full rounded-full transition-all duration-1000"
                  style={{ width: "65%" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Nivel 12</span>
                <span>Siguiente: 15,000</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <span className="text-3xl font-black text-primary">156</span>
                <p className="text-xs text-muted-foreground mt-1">Posición global</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <span className="text-3xl font-black text-primary">+2,340</span>
                <p className="text-xs text-muted-foreground mt-1">Hoy</p>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/5 blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-primary/5 blur-xl" />
        </div>

        {/* Energy Sources */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {energySources.map((source, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/15 transition-colors">
                <source.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{source.label}</p>
              <span className="text-lg font-bold text-primary">{source.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
