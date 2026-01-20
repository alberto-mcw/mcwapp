import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FireCircle } from "@/components/FireCircle";
import { Trophy, TrendingUp, Zap, MapPin, Instagram, Target, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RankedProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_energy: number;
  city: string | null;
  bio: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
}

interface ProfileStats {
  triviaCorrect: number;
  triviaTotal: number;
  challengesCompleted: number;
}

const Ranking = () => {
  const [profiles, setProfiles] = useState<RankedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<RankedProfile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, total_energy, city, bio, instagram_handle, tiktok_handle')
        .order('total_energy', { ascending: false })
        .limit(50);

      if (!error && data) {
        setProfiles(data);
        const total = data.reduce((sum, p) => sum + (p.total_energy || 0), 0);
        setTotalEnergy(total);
      }
      setLoading(false);
    };

    fetchRanking();
  }, []);

  // Fetch stats when a profile is selected
  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!selectedProfile) {
        setProfileStats(null);
        return;
      }

      setLoadingStats(true);
      
      try {
        // Fetch trivia completions from the new trivia_completions table
        const { data: triviaCompletions } = await supabase
          .from('trivia_completions')
          .select('is_correct')
          .eq('user_id', selectedProfile.user_id);

        // Fetch weekly challenges completed (approved submissions)
        const { data: submissions } = await supabase
          .from('challenge_submissions')
          .select('id')
          .eq('user_id', selectedProfile.user_id)
          .eq('status', 'approved');

        // Calculate trivia stats
        const triviaTotal = triviaCompletions?.length || 0;
        const triviaCorrect = triviaCompletions?.filter(t => t.is_correct).length || 0;

        setProfileStats({
          triviaCorrect,
          triviaTotal,
          challengesCompleted: submissions?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchProfileStats();
  }, [selectedProfile]);

  const formatEnergy = (energy: number) => {
    return energy.toLocaleString('es-ES');
  };

  const formatTotalEnergy = (energy: number) => {
    if (energy >= 1000000) {
      return (energy / 1000000).toFixed(1) + 'M';
    } else if (energy >= 1000) {
      return (energy / 1000).toFixed(1) + 'K';
    }
    return energy.toString();
  };

  const getLevel = (energy: number) => {
    if (energy >= 10000) return "Elite";
    if (energy >= 5000) return "Pro";
    if (energy >= 1000) return "Avanzado";
    if (energy >= 100) return "Iniciado";
    return "Novato";
  };

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
              <p className="text-2xl font-unbounded font-black">
                {profiles[0]?.total_energy ? formatTotalEnergy(profiles[0].total_energy) : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Top Energía</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-unbounded font-black">{formatTotalEnergy(totalEnergy)}</p>
              <p className="text-xs text-muted-foreground">Energía Total</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-unbounded font-black">{profiles.length}</p>
              <p className="text-xs text-muted-foreground">Participantes</p>
            </div>
          </div>

          {/* Ranking List */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-secondary/50 px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider">Top {profiles.length}</span>
                  <span className="text-xs text-muted-foreground">Actualizado en tiempo real</span>
                </div>
              </div>
              
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">Cargando ranking...</div>
              ) : profiles.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No hay participantes aún</div>
              ) : (
                <div className="divide-y divide-border">
                  {profiles.map((profile, index) => {
                    const pos = index + 1;
                    return (
                      <div 
                        key={profile.id}
                        onClick={() => setSelectedProfile(profile)}
                        className={`flex items-center gap-4 p-4 transition-colors hover:bg-secondary/30 cursor-pointer ${
                          pos <= 3 ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="relative">
                          {pos <= 3 && (
                            <FireCircle size="sm" intensity={pos === 1 ? "high" : "medium"} className="absolute -inset-2" />
                          )}
                          <span className={`relative z-10 font-unbounded text-2xl font-black w-10 text-center block ${
                            pos <= 3 ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {pos}
                          </span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                          {profile.avatar_url || '👨‍🍳'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{profile.display_name || 'Chef Anónimo'}</p>
                          <p className="text-xs text-muted-foreground">Nivel {getLevel(profile.total_energy)}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-unbounded font-bold text-primary">{formatEnergy(profile.total_energy)}</p>
                          <p className="text-xs text-muted-foreground">energía</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* Profile Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">Perfil del usuario</DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl mx-auto mb-4">
                {selectedProfile.avatar_url || '👨‍🍳'}
              </div>
              
              <h3 className="font-unbounded text-xl font-bold mb-1">
                {selectedProfile.display_name || 'Chef Anónimo'}
              </h3>
              
              <p className="text-primary font-bold mb-2">
                Nivel {getLevel(selectedProfile.total_energy)}
              </p>
              
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-unbounded font-bold text-primary">
                  {formatEnergy(selectedProfile.total_energy)} energía
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <Target className="w-5 h-5 text-primary mx-auto mb-1" />
                  {loadingStats ? (
                    <p className="text-sm text-muted-foreground">...</p>
                  ) : profileStats ? (
                    <>
                      <p className="font-unbounded font-bold text-lg">
                        {profileStats.triviaTotal > 0 
                          ? Math.round((profileStats.triviaCorrect / profileStats.triviaTotal) * 100) 
                          : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Mini Retos acertados</p>
                      <p className="text-[10px] text-muted-foreground/70">
                        ({profileStats.triviaCorrect}/{profileStats.triviaTotal})
                      </p>
                    </>
                  ) : null}
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <Video className="w-5 h-5 text-primary mx-auto mb-1" />
                  {loadingStats ? (
                    <p className="text-sm text-muted-foreground">...</p>
                  ) : profileStats ? (
                    <>
                      <p className="font-unbounded font-bold text-lg">
                        {profileStats.challengesCompleted}
                      </p>
                      <p className="text-xs text-muted-foreground">Desafíos completados</p>
                    </>
                  ) : null}
                </div>
              </div>
              
              {selectedProfile.city && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{selectedProfile.city}</span>
                </div>
              )}
              
              {(selectedProfile.instagram_handle || selectedProfile.tiktok_handle) && (
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
                  {selectedProfile.instagram_handle && (
                    <a 
                      href={`https://instagram.com/${selectedProfile.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      @{selectedProfile.instagram_handle}
                    </a>
                  )}
                  {selectedProfile.tiktok_handle && (
                    <a 
                      href={`https://tiktok.com/@${selectedProfile.tiktok_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      @{selectedProfile.tiktok_handle}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Ranking;
