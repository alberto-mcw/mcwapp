import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FireCircle } from "@/components/FireCircle";
import { Trophy, TrendingUp, Zap, MapPin, Instagram, Target, Video, LogIn, Search, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useRanking, formatEnergy, formatTotalEnergy, getLevel, countryFlag, countryName, type ProfileStats, type RankedItem } from "@/hooks/useRanking";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Ranking = () => {
  const {
    profiles, loading, stats, currentPage, totalPages, totalCount,
    searchQuery, countryFilter, countries, myPosition, jumpingToMe, highlightUserId, user,
    handleSearch, handleCountryChange, goToPage, jumpToMyPosition, setRowRef,
  } = useRanking();

  const [selectedProfile, setSelectedProfile] = useState<RankedItem | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const handleSelectProfile = async (profile: RankedItem) => {
    setSelectedProfile(profile);
    setLoadingStats(true);
    try {
      const [{ data: triviaCompletions }, { data: submissions }] = await Promise.all([
        supabase.from('trivia_completions').select('is_correct').eq('user_id', profile.userId),
        supabase.from('challenge_submissions').select('id').eq('user_id', profile.userId).eq('status', 'approved'),
      ]);
      const triviaTotal = triviaCompletions?.length || 0;
      const triviaCorrect = triviaCompletions?.filter(t => t.is_correct).length || 0;
      setProfileStats({ triviaCorrect, triviaTotal, challengesCompleted: submissions?.length || 0 });
    } catch { setProfileStats(null); }
    finally { setLoadingStats(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Ranking</span>
            </div>
            
            <h1 className="font-unbounded text-4xl md:text-6xl font-black uppercase mb-4">El Ranking</h1>
            
            <p className="text-muted-foreground max-w-xl mx-auto">
              Clasificación de los participantes por país. Los puntos acumulados determinan tu posición. Se actualiza diariamente.
            </p>
          </div>

          {/* My Rank Card (logged in only) */}
          {user && myPosition && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tu posición</p>
                    <p className="font-unbounded text-2xl font-black text-primary">
                      #{myPosition.rank}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        · {formatEnergy(myPosition.energy)} puntos
                      </span>
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2 shrink-0" onClick={jumpToMyPosition} disabled={jumpingToMe}>
                  <Zap className="w-4 h-4" />
                  {jumpingToMe ? 'Buscando...' : 'Ver en la lista'}
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-unbounded font-black">{formatTotalEnergy(stats.topEnergy)}</p>
              <p className="text-xs text-muted-foreground">Top Puntos</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-unbounded font-black">{formatTotalEnergy(stats.totalEnergy)}</p>
              <p className="text-xs text-muted-foreground">Puntos Totales</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-unbounded font-black">{stats.totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Participantes</p>
            </div>
          </div>

          {/* Search + Country Filter */}
          <div className="max-w-2xl mx-auto mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar participante..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={countryFilter || "all"}
              onValueChange={(v) => handleCountryChange(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-full sm:w-48 shrink-0">
                <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Todos los países" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌍 Todos los países</SelectItem>
                {countries.map(c => (
                  <SelectItem key={c.country} value={c.country}>
                    {countryFlag(c.country)} {countryName(c.country)} ({c.userCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ranking List */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-secondary/50 px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {totalCount} participantes
                    {countryFilter && <span className="ml-1">{countryFlag(countryFilter)}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">Actualizado diariamente</span>
                </div>
              </div>
              
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">Cargando ranking...</div>
              ) : profiles.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {searchQuery ? 'Sin resultados para esa búsqueda' : 'No hay participantes aún'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {profiles.map((profile) => {
                    const pos = profile.rankIndex;
                    const isMe = user && profile.userId === user.id;
                    const isHighlighted = profile.userId === highlightUserId;
                    return (
                      <div 
                        key={profile.id}
                        ref={(el) => setRowRef(profile.userId, el)}
                        onClick={() => handleSelectProfile(profile)}
                        className={`flex items-center gap-4 p-4 transition-all duration-500 hover:bg-secondary/30 cursor-pointer ${
                          isHighlighted ? "bg-primary/20 ring-2 ring-primary/50 animate-pulse" :
                          isMe ? "bg-primary/10 ring-1 ring-primary/20" : 
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
                          {profile.avatarUrl || '👨‍🍳'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {profile.alias || 'Chef Anónimo'}
                            {isMe && <span className="ml-2 text-xs text-primary font-bold">(Tú)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {countryFlag(profile.country)} Nivel {profile.level}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-unbounded font-bold text-primary">{formatEnergy(profile.energy)}</p>
                          <p className="text-xs text-muted-foreground">puntos</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Página {currentPage} de {totalPages}
                </span>
                <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="text-center mt-8">
              {!user && (
                <>
                  <p className="text-muted-foreground mb-4">
                    Inicia sesión para ver tu posición destacada
                  </p>
                  <Button asChild size="lg" className="gap-2">
                    <Link to="/auth">
                      <LogIn className="w-5 h-5" />
                      Iniciar sesión
                    </Link>
                  </Button>
                </>
              )}
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
                {selectedProfile.avatarUrl || '👨‍🍳'}
              </div>
              <h3 className="font-unbounded text-xl font-bold mb-1">
                {selectedProfile.alias || 'Chef Anónimo'}
              </h3>
              <p className="text-primary font-bold mb-1">Nivel {selectedProfile.level}</p>
              {selectedProfile.country && (
                <p className="text-sm text-muted-foreground mb-2">
                  {countryFlag(selectedProfile.country)} {countryName(selectedProfile.country)}
                </p>
              )}
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-unbounded font-bold text-primary">{formatEnergy(selectedProfile.energy)} energía</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <Target className="w-5 h-5 text-primary mx-auto mb-1" />
                  {loadingStats ? (
                    <p className="text-sm text-muted-foreground">...</p>
                  ) : profileStats ? (
                    <>
                      <p className="font-unbounded font-bold text-lg">
                        {profileStats.triviaTotal > 0 ? Math.round((profileStats.triviaCorrect / profileStats.triviaTotal) * 100) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Mini Retos acertados</p>
                      <p className="text-[10px] text-muted-foreground/70">({profileStats.triviaCorrect}/{profileStats.triviaTotal})</p>
                    </>
                  ) : null}
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <Video className="w-5 h-5 text-primary mx-auto mb-1" />
                  {loadingStats ? (
                    <p className="text-sm text-muted-foreground">...</p>
                  ) : profileStats ? (
                    <>
                      <p className="font-unbounded font-bold text-lg">{profileStats.challengesCompleted}</p>
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
              
              {(selectedProfile.instagramHandle || selectedProfile.tiktokHandle) && (
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
                  {selectedProfile.instagramHandle && (
                    <a href={`https://instagram.com/${selectedProfile.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Instagram className="w-4 h-4" />@{selectedProfile.instagramHandle}
                    </a>
                  )}
                  {selectedProfile.tiktokHandle && (
                    <a href={`https://tiktok.com/@${selectedProfile.tiktokHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      @{selectedProfile.tiktokHandle}
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
