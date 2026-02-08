import { Flame, Users, Sparkles } from "lucide-react";

const blocks = [
  {
    icon: Flame,
    title: "Competición viva",
    description: "Directos. Digital. Presencial. Todo a la vez. Todo de verdad.",
  },
  {
    icon: Users,
    title: "La comunidad decide",
    description: "Tu voz pesa. Tu voto importa. Esto no es un programa. Es un movimiento.",
  },
  {
    icon: Sparkles,
    title: "Mucho más que cocinar",
    description: "Estrategia. Alianzas. Riesgo. Lo que pasa fuera de la cocina también cuenta.",
  },
];

export const TeaserSection = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {blocks.map((block, i) => (
            <div
              key={block.title}
              className="text-center animate-slide-up group"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 mb-5 group-hover:bg-primary/10 transition-colors">
                <block.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                {block.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {block.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
