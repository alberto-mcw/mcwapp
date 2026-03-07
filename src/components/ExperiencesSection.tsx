import { Trophy, Package, MapPin } from "lucide-react";

const experiences = [
  {
    icon: Trophy,
    title: "MasterChef Experience",
    subtitle: "Top 5",
    description: "Vive la experiencia completa. Cocina con los mejores. El sueño hecho realidad.",
    badge: "Élite",
    highlight: true
  },
  {
    icon: Package,
    title: "Caja misteriosa",
    subtitle: "Top 1.000",
    description: "Recibe ingredientes sorpresa en tu casa y demuestra tu talento ante miles.",
    badge: "Primer corte"
  },
  {
    icon: MapPin,
    title: "Evento presencial",
    subtitle: "Top 100",
    description: "De lo digital a lo real. Conoce a la comunidad y compite cara a cara.",
    badge: "Salto real"
  }
];

export const ExperiencesSection = () => {
  return (
    <section className="relative py-20 px-4 bg-background overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="badge-primary mb-4 inline-block">Recompensas</span>
          <h2 className="section-title mb-4">
            Hitos de <span className="text-gradient-primary">estatus</span>
          </h2>
          <p className="text-muted-foreground">
            Tus puntos desbloquean experiencias únicas
          </p>
        </div>

        {/* Experience Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {experiences.map((exp, index) => (
            <div 
              key={index}
              className={`relative group ${exp.highlight ? "md:-mt-4 md:mb-4" : ""}`}
            >
              {exp.highlight && (
                <div className="absolute -inset-1 rounded-2xl bg-gradient-primary opacity-10 blur-lg group-hover:opacity-15 transition-opacity" />
              )}
              
              <div className={`relative h-full feature-panel text-center ${
                exp.highlight ? "border-primary/30" : ""
              }`}>
                {/* Icon */}
                <div className="relative inline-flex mb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    exp.highlight 
                      ? "bg-gradient-primary glow-warm-intense" 
                      : "bg-primary/10 glow-warm"
                  }`}>
                    <exp.icon className={`w-10 h-10 ${
                      exp.highlight ? "text-primary-foreground" : "text-primary"
                    }`} />
                  </div>
                  {exp.highlight && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping opacity-20" />
                  )}
                </div>

                {/* Badge */}
                <span className={exp.highlight ? "badge-primary" : "badge-muted"}>
                  {exp.badge}
                </span>

                {/* Subtitle */}
                <p className="text-sm text-primary font-bold mt-4">
                  {exp.subtitle}
                </p>

                {/* Title */}
                <h3 className="text-lg font-bold my-2 text-foreground">
                  {exp.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
