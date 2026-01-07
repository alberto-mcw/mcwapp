import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FireCircle } from "@/components/FireCircle";
import { Trophy, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const topPlayers = [
  { pos: 1, name: "ChefMaster_Pro", energy: "24,580", avatar: "🔥" },
  { pos: 2, name: "CocinaFusion", energy: "22,340", avatar: "⚡" },
  { pos: 3, name: "SaborIntens0", energy: "21,890", avatar: "🌶️" },
  { pos: 4, name: "GastroNinja", energy: "19,450", avatar: "🍳" },
  { pos: 5, name: "ChefRebelde", energy: "18,920", avatar: "🔪" },
  { pos: 6, name: "CocinaCreativa", energy: "17,800", avatar: "🎨" },
  { pos: 7, name: "SazónMaster", energy: "16,540", avatar: "🧂" },
  { pos: 8, name: "FuegoLento", energy: "15,200", avatar: "♨️" },
  { pos: 9, name: "RecetaViva", energy: "14,890", avatar: "📖" },
  { pos: 10, name: "ChefDigital", energy: "14,120", avatar: "💻" },
];

const Ranking = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Ranking en vivo
              </span>
            </div>
            
            <h1 className="font-unbounded text-4xl md:text-6xl font-black uppercase mb-4">
              El Ranking<br />
              <span className="text-gradient">Nunca Duerme</span>
            </h1>
            
            <p className="text-muted-foreground max-w-xl mx-auto">
              Sigue en tiempo real la clasificación de los participantes. 
              La energía acumulada determina tu posición.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-unbounded font-black">5</p>
              <p className="text-xs text-muted-foreground">Top Experience</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-unbounded font-black">1.2M</p>
              <p className="text-xs text-muted-foreground">Energía Total</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-unbounded font-black">8.5K</p>
              <p className="text-xs text-muted-foreground">Participantes</p>
            </div>
          </div>

          {/* Ranking List */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-secondary/50 px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider">Top 10</span>
                  <span className="text-xs text-muted-foreground">Actualizado hace 2 min</span>
                </div>
              </div>
              
              <div className="divide-y divide-border">
                {topPlayers.map((player) => (
                  <div 
                    key={player.pos}
                    className={`flex items-center gap-4 p-4 transition-colors hover:bg-secondary/30 ${
                      player.pos <= 3 ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="relative">
                      {player.pos <= 3 && (
                        <FireCircle size="sm" intensity={player.pos === 1 ? "high" : "medium"} className="absolute -inset-2" />
                      )}
                      <span className={`relative z-10 font-unbounded text-2xl font-black w-10 text-center block ${
                        player.pos <= 3 ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {player.pos}
                      </span>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                      {player.avatar}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">Nivel Elite</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-unbounded font-bold text-primary">{player.energy}</p>
                      <p className="text-xs text-muted-foreground">energía</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                Descarga la app para ver el ranking completo y tu posición
              </p>
              <Button size="lg" className="gap-2">
                <Zap className="w-5 h-5" />
                Ver mi posición
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Ranking;
