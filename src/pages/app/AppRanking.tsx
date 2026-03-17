import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { FireCircle } from '@/components/FireCircle';
import { Trophy, TrendingUp, Zap, MapPin, Instagram, Target, Video, ArrowLeft, Search, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useRanking, formatEnergy, formatTotalEnergy, countryFlag, countryName, type RankedItem, type ProfileStats } from '@/hooks/useRanking';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import logoVerticalLight from '@/assets/logo-vertical-light.png';

const AppRanking = () => {
  const navigate = useNavigate();
  const {
    profiles, loading, stats, currentPage, totalPages, totalCount,
    searchQuery, countryFilter, countries, myPosition, highlightUserId, user,
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
    <MobileAppLayout>
      <AppHeader
        rightAction={
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      {/* Hero */}
      <div className="px-4 pt-4 pb-6">
        <div className="flex flex-col items-center text-center">
          <img
            src={logoVerticalLight}
            alt="El Reto"
            className="h-20 w-auto object-contain mb-3"
          />
          <h1 className="text-2xl font-bold text-gradient-primary leading-tight">
            Ranking
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Se actualiza diariamente
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* My Rank Card */}
        {user && myPosition && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tu posición</p>
              <p className="text-xl font-black text-primary">
                #{myPosition.rank}
                <span className="text-xs font-normal text-muted-foreground ml-2">{formatEnergy(myPosition.energy)} ⚡</span>
              </p>
            </div>
            <button onClick={jumpToMyPosition} className="btn-primary px-4 py-2 text-xs font-bold">
              Ver en lista
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-black">{formatTotalEnergy(stats.topEnergy)}</p>
            <p className="text-[10px] text-muted-foreground">Top</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-black">{formatTotalEnergy(stats.totalEnergy)}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-black">{stats.totalParticipants}</p>
            <p className="text-[10px] text-muted-foreground">Usuarios</p>
          </div>
        </div>

        {/* Search + Country */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="app-input pl-9 !border-b !border-border"
            />
          </div>
          <Select
            value={countryFilter || "all"}
            onValueChange={(v) => handleCountryChange(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-24 h-10 shrink-0 rounded-xl border-border">
              <Globe className="w-3 h-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 Todos</SelectItem>
              {countries.map(c => (
                <SelectItem key={c.country} value={c.country}>
                  {countryFlag(c.country)} {countryName(c.country)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ranking List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Cargando ranking...</div>
          ) : profiles.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {searchQuery ? 'Sin resultados' : 'No hay participantes aún'}
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
                    className={`flex items-center gap-3 p-3 transition-all duration-500 active:bg-secondary/30 ${
                      isHighlighted ? "bg-primary/20 ring-2 ring-primary/50 animate-pulse" :
                      isMe ? "bg-primary/10 ring-1 ring-primary/20" : 
                      pos <= 3 ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="relative w-8 flex-shrink-0">
                      {pos <= 3 && (
                        <FireCircle size="sm" intensity={pos === 1 ? "high" : "medium"} className="absolute -inset-1" />
                      )}
                      <span className={`relative z-10 text-lg font-black block text-center ${
                        pos <= 3 ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {pos}
                      </span>
                    </div>
                    
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                      {profile.avatarUrl || '👨‍🍳'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {profile.alias || 'Chef Anónimo'}
                        {isMe && <span className="ml-1 text-[10px] text-primary font-bold">(Tú)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {countryFlag(profile.country)} {profile.level}
                      </p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="font-display text-sm font-bold text-primary">{formatEnergy(profile.energy)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">{currentPage} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Perfil del usuario</DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl mx-auto mb-3">
                {selectedProfile.avatarUrl || '👨‍🍳'}
              </div>
              <h3 className="font-display text-lg font-bold mb-1">{selectedProfile.alias || 'Chef Anónimo'}</h3>
              <p className="text-primary text-sm font-bold mb-1">Nivel {selectedProfile.level}</p>
              {selectedProfile.country && (
                <p className="text-xs text-muted-foreground mb-2">{countryFlag(selectedProfile.country)} {countryName(selectedProfile.country)}</p>
              )}
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-display text-sm font-bold text-primary">{formatEnergy(selectedProfile.energy)} puntos</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-secondary/50 rounded-xl p-2">
                  <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                  {loadingStats ? <p className="text-xs text-muted-foreground">...</p> : profileStats ? (
                    <>
                      <p className="font-display font-bold">{profileStats.triviaTotal > 0 ? Math.round((profileStats.triviaCorrect / profileStats.triviaTotal) * 100) : 0}%</p>
                      <p className="text-[10px] text-muted-foreground">Mini Retos</p>
                    </>
                  ) : null}
                </div>
                <div className="bg-secondary/50 rounded-xl p-2">
                  <Video className="w-4 h-4 text-primary mx-auto mb-1" />
                  {loadingStats ? <p className="text-xs text-muted-foreground">...</p> : profileStats ? (
                    <>
                      <p className="font-display font-bold">{profileStats.challengesCompleted}</p>
                      <p className="text-[10px] text-muted-foreground">Desafíos</p>
                    </>
                  ) : null}
                </div>
              </div>
              
              {selectedProfile.city && (
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">{selectedProfile.city}</span>
                </div>
              )}
              
              {(selectedProfile.instagramHandle || selectedProfile.tiktokHandle) && (
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-border">
                  {selectedProfile.instagramHandle && (
                    <a href={`https://instagram.com/${selectedProfile.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                      <Instagram className="w-3 h-3" />@{selectedProfile.instagramHandle}
                    </a>
                  )}
                  {selectedProfile.tiktokHandle && (
                    <a href={`https://tiktok.com/@${selectedProfile.tiktokHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
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
    </MobileAppLayout>
  );
};

export default AppRanking;
