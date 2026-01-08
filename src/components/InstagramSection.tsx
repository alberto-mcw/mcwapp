import { Instagram } from "lucide-react";
import { Button } from "./ui/button";

export const InstagramSection = () => {
  // Instagram oficial de MasterChef World App
  const instagramUsername = "mchefworldapp";
  const instagramUrl = `https://www.instagram.com/${instagramUsername}`;

  return (
    <section className="relative py-20 px-4 bg-background overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Instagram className="w-4 h-4" />
            SÍGUENOS EN INSTAGRAM
          </div>
          <h2 className="font-unbounded text-3xl md:text-4xl font-bold uppercase mb-4">
            ÚNETE A LA <span className="text-primary">COMUNIDAD</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Descubre recetas, retos virales y contenido exclusivo. 
            ¡Comparte tus platos con #ElReto2026!
          </p>
        </div>

        {/* Instagram Embed Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
          {/* Embed posts using blockquote - Instagram will render them */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <a
              key={i}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square bg-card border border-border rounded-xl overflow-hidden group relative hover:border-primary/50 transition-all duration-300"
            >
              {/* Placeholder gradient - se reemplazará con embed real */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 group-hover:opacity-80 transition-opacity" />
              
              {/* Instagram icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 backdrop-blur-sm p-4 rounded-full">
                  <Instagram className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Decorative food icon placeholder */}
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                <span className="text-4xl">🍳</span>
              </div>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button 
            asChild 
            size="lg" 
            className="gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 border-0"
          >
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
              <Instagram className="w-5 h-5" />
              Seguir @{instagramUsername}
            </a>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Usa <span className="text-primary font-bold">#ElReto2026</span> para aparecer en nuestro feed
          </p>
        </div>
      </div>
    </section>
  );
};
