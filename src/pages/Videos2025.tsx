import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Trophy, Star, Play, Calendar } from "lucide-react";

// Placeholder data for 2025 featured videos
const featuredVideos = [
  {
    id: 1,
    title: "Paella Valenciana",
    chef: "Carlos García",
    challenge: "Desafío Arroz",
    thumbnail: "/placeholder.svg",
    likes: 1247,
    position: 1
  },
  {
    id: 2,
    title: "Tacos al Pastor",
    chef: "María López",
    challenge: "Desafío Internacional",
    thumbnail: "/placeholder.svg",
    likes: 1089,
    position: 2
  },
  {
    id: 3,
    title: "Risotto de Setas",
    chef: "Pedro Martínez",
    challenge: "Desafío Vegetariano",
    thumbnail: "/placeholder.svg",
    likes: 956,
    position: 3
  }
];

const Videos2025 = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 mb-4">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Temporada 2025</span>
            </div>
            <h1 className="font-unbounded text-4xl md:text-5xl font-bold mb-4">
              El Reto <span className="text-amber-400">2025</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Revive los mejores momentos de la primera temporada. Estos fueron los platos 
              más votados por nuestra comunidad.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-12 max-w-xl mx-auto">
            <div className="text-center p-4 rounded-xl bg-card border border-border">
              <div className="text-2xl font-bold text-primary">847</div>
              <div className="text-xs text-muted-foreground">Participantes</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-card border border-border">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-xs text-muted-foreground">Desafíos</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-card border border-border">
              <div className="text-2xl font-bold text-primary">2.3K</div>
              <div className="text-xs text-muted-foreground">Vídeos</div>
            </div>
          </div>

          {/* Featured Videos */}
          <div className="mb-12">
            <h2 className="font-unbounded text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Top 3 del Año
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {featuredVideos.map((video) => (
                <div 
                  key={video.id}
                  className="relative group rounded-2xl overflow-hidden bg-card border border-border hover:border-amber-500/50 transition-all"
                >
                  {/* Position Badge */}
                  <div className={`absolute top-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    video.position === 1 ? 'bg-amber-400 text-black' :
                    video.position === 2 ? 'bg-gray-300 text-black' :
                    'bg-amber-700 text-white'
                  }`}>
                    {video.position}º
                  </div>

                  {/* Thumbnail */}
                  <div className="aspect-[9/16] bg-muted relative">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="text-xs text-amber-400 mb-1">{video.challenge}</div>
                    <h3 className="font-bold mb-1">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{video.chef}</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-4 h-4 fill-amber-400" />
                        {video.likes}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="font-unbounded text-xl font-bold mb-2">
              Galería Completa Próximamente
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Estamos preparando una galería completa con todos los vídeos destacados 
              de El Reto 2025. ¡Vuelve pronto!
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Videos2025;
