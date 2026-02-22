import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Camera, Sparkles, Download, Heart, Share2, ChefHat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Camera, title: "Sube tu receta", desc: "Haz una foto de la receta manuscrita de tu abuela o de cualquier libro antiguo." },
  { icon: Sparkles, title: "La IA la digitaliza", desc: "Nuestra inteligencia artificial lee, interpreta y estructura la receta completa." },
  { icon: Download, title: "Tu recetario eterno", desc: "Descarga un PDF premium, ajusta raciones, genera lista de la compra y comparte." },
];

export default function RecetarioLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleCTA = () => {
    const params = new URLSearchParams();
    const utm_source = searchParams.get("utm_source");
    const utm_medium = searchParams.get("utm_medium");
    const utm_campaign = searchParams.get("utm_campaign");
    const ref = searchParams.get("ref");
    if (utm_source) params.set("utm_source", utm_source);
    if (utm_medium) params.set("utm_medium", utm_medium);
    if (utm_campaign) params.set("utm_campaign", utm_campaign);
    if (ref) params.set("ref", ref);
    navigate(`/recetario/captura?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-recetario-bg text-recetario-fg">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-recetario-primary" />
          <span className="font-display text-xl font-bold tracking-tight text-recetario-fg">El Recetario Eterno</span>
        </div>
        <Button
          variant="ghost"
          className="text-recetario-primary hover:text-recetario-primary-hover text-sm font-medium"
          onClick={() => navigate("/recetario/biblioteca")}
        >
          Mi Biblioteca
        </Button>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-16 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-recetario-primary/10 text-recetario-primary px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <Heart className="w-4 h-4" />
          Preserva la memoria culinaria de tu familia
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] mb-6 text-recetario-fg">
          Las recetas que se escriben a mano<br />
          <span className="text-recetario-primary">no deberían perderse.</span>
        </h1>
        <p className="text-lg md:text-xl text-recetario-muted max-w-xl mx-auto mb-10 leading-relaxed font-body">
          Convierte las recetas de tu abuela en un libro eterno con inteligencia artificial. Gratis, privado y para siempre.
        </p>
        <Button
          onClick={handleCTA}
          className="bg-recetario-primary hover:bg-recetario-primary-hover text-white text-lg px-8 py-6 rounded-full shadow-lg shadow-recetario-primary/25 transition-all hover:shadow-xl hover:shadow-recetario-primary/30 hover:scale-[1.02]"
        >
          Digitalizar mi receta
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </section>

      {/* Before/After Visual */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="bg-recetario-surface rounded-2xl p-8 border-2 border-dashed border-recetario-primary/30 text-center">
            <p className="font-display text-lg italic text-recetario-muted mb-2">📝 Receta manuscrita</p>
            <p className="text-sm text-recetario-muted-light font-body">Letra de abuela, manchas de aceite, papel amarillento...</p>
            <div className="mt-4 h-32 bg-recetario-border rounded-lg flex items-center justify-center">
              <span className="font-display text-2xl text-recetario-muted/50 italic">Cocido madrileño...</span>
            </div>
          </div>
          <div className="bg-recetario-card rounded-2xl p-8 shadow-lg border border-recetario-border">
            <p className="font-display text-lg text-recetario-fg font-bold mb-2">✨ Receta digitalizada</p>
            <p className="text-sm text-recetario-muted-light mb-4 font-body">Ingredientes, pasos, raciones, lista de la compra...</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm"><ChefHat className="w-4 h-4 text-recetario-primary" /><span className="font-medium">Cocido Madrileño</span></div>
              <div className="flex items-center gap-2 text-sm text-recetario-muted"><span>⏱ 3 horas</span><span>·</span><span>Media</span><span>·</span><span>4 personas</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12 text-recetario-fg">
          Así de fácil funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 bg-recetario-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-7 h-7 text-recetario-primary" />
              </div>
              <div className="text-xs font-bold text-recetario-primary mb-2 font-display uppercase tracking-wider">Paso {i + 1}</div>
              <h3 className="font-display text-lg font-bold mb-2 text-recetario-fg">{step.title}</h3>
              <p className="text-sm text-recetario-muted leading-relaxed font-body">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="bg-recetario-fg rounded-3xl p-8 md:p-12 text-recetario-bg">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">Todo lo que incluye</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Digitalización con IA avanzada",
              "Ajuste de raciones (2-8 personas)",
              "Lista de la compra organizada",
              "Alternativas de ingredientes",
              "Versión saludable automática",
              "PDF premium descargable",
              "Biblioteca privada ilimitada",
              "Compartir con enlace único",
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-recetario-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-sm font-body">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20 text-center">
        <p className="font-display text-xl md:text-2xl text-recetario-muted mb-6 max-w-lg mx-auto">
          Cada receta manuscrita es un tesoro. <br />No dejes que se pierda.
        </p>
        <Button
          onClick={handleCTA}
          className="bg-recetario-primary hover:bg-recetario-primary-hover text-white text-lg px-8 py-6 rounded-full shadow-lg shadow-recetario-primary/25"
        >
          Digitalizar mi receta
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-recetario-border text-center text-sm text-recetario-muted-light font-body">
        <p>El Recetario Eterno · Preservando la memoria culinaria familiar</p>
      </footer>
    </div>
  );
}
