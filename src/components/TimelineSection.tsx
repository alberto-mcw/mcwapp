import { Lock, Unlock, Trophy, Star, Users } from "lucide-react";

const timelineItems = [
  {
    period: "Enero – Abril",
    title: "Registro abierto",
    description: "Inscríbete y prepara tu cocina",
    status: "active",
    icon: Unlock,
    badge: "Disponible"
  },
  {
    period: "Vídeo inicial",
    title: "Activa la manopla",
    description: "Presenta tu estilo culinario",
    status: "upcoming",
    icon: Star,
    badge: "Desbloqueable"
  },
  {
    period: "Puntos activos",
    title: "El juego empieza",
    description: "Comienza a generar puntos",
    status: "upcoming",
    icon: Lock,
    badge: "Ranking"
  },
  {
    period: "Continuo",
    title: "Ranking en tiempo real",
    description: "Compite cada día por posiciones",
    status: "upcoming",
    icon: Trophy,
    badge: "Siempre activo"
  },
  {
    period: "Top 1.000",
    title: "Caja misteriosa",
    description: "Ingredientes sorpresa en casa",
    status: "locked",
    icon: Lock,
    badge: "Solo ranking"
  },
  {
    period: "Top 100",
    title: "Evento presencial",
    description: "De lo digital a lo real",
    status: "locked",
    icon: Users,
    badge: "Estatus"
  },
  {
    period: "Top 5",
    title: "MasterChef Experience",
    description: "El sueño hecho realidad",
    status: "locked",
    icon: Trophy,
    badge: "Élite"
  }
];

export const TimelineSection = () => {
  return (
    <section className="relative py-20 px-4 bg-card overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      
      <div className="container max-w-4xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="badge-primary mb-4 inline-block">El camino</span>
          <h2 className="section-title mb-4">
            Tu <span className="text-gradient-primary">recorrido</span> 2026
          </h2>
          <p className="text-muted-foreground">
            Cada paso te acerca al siguiente nivel
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-primary/10" />

          <div className="space-y-8">
            {timelineItems.map((item, index) => (
              <div 
                key={index}
                className={`relative flex items-start gap-6 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Circle Marker */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
                  <div className={`relative ${item.status === "active" ? "animate-pulse-soft" : ""}`}>
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        item.status === "active" 
                          ? "bg-gradient-primary glow-warm-intense"
                          : item.status === "upcoming"
                          ? "bg-primary/20 border-2 border-primary/40"
                          : "bg-muted border-2 border-border"
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${
                        item.status === "active" ? "text-primary-foreground" : "text-muted-foreground"
                      }`} />
                    </div>
                    {item.status === "active" && (
                      <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
                    )}
                  </div>
                </div>

                {/* Content Card */}
                <div className={`ml-24 md:ml-0 md:w-[calc(50%-3rem)] ${
                  index % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"
                }`}>
                  <div className={`feature-panel ${
                    item.status === "active" ? "border-primary/30" : ""
                  }`}>
                    <div className={`flex items-center gap-2 mb-2 ${
                      index % 2 === 0 ? "md:justify-end" : ""
                    }`}>
                      <span className={`${
                        item.status === "active" ? "badge-primary" : "badge-muted"
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <span className="text-xs text-primary font-bold tracking-wider">
                      {item.period}
                    </span>
                    <h3 className="text-base font-bold mt-1 mb-2 text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
