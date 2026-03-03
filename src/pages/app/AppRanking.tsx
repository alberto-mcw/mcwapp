import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/app/AppHeader';
import { SectionTitle } from '@/components/app/SectionTitle';
import { FireCircle } from '@/components/FireCircle';
import { Trophy, TrendingUp, Zap, MapPin, Instagram, Target, Video, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

const AppRanking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<RankedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<RankedProfile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const myRowRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!selectedProfile) {
        setProfileStats(null);
        return;
      }

      setLoadingStats(true);
      
      try {
        const { data: triviaCompletions } = await supabase
          .from('trivia_completions')
          .select('is_correct')
          .eq('user_id', selectedProfile.user_id);

        const { data: submissions } = await supabase
          .from('challenge_submissions')
          .select('id')
          .eq('user_id', selectedProfile.user_id)
          .eq('status', 'approved');

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
    <MobileAppLayout>
      <AppHeader
        rightAction={
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />
      <SectionTitle
        topLabel="2026"
        title="Ranking"
        subtitle="Se actualiza diariamente"
      />

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-unbounded font-black">
              {profiles[0]?.total_energy ? formatTotalEnergy(profiles[0].total_energy) : '-'}
            </p>
            <p className="text-[10px] text-muted-foreground">Top</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-unbounded font-black">{formatTotalEnergy(totalEnergy)}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-unbounded font-black">{profiles.length}</p>
            <p className="text-[10px] text-muted-foreground">Usuarios</p>
          </div>
        </div>

        {/* Update indicator */}
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Actualizado diariamente</span>
        </div>

        {/* Ranking List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Cargando ranking...</div>
          ) : profiles.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No hay participantes aún</div>
          ) : (
            <div className="divide-y divide-border">
              {profiles.map((profile, index) => {
                const pos = index + 1;
                const isMe = user && profile.user_id === user.id;
                return (
                  <div 
                    key={profile.id}
                    ref={isMe ? myRowRef : undefined}
                    onClick={() => setSelectedProfile(profile)}
                    className={`flex items-center gap-3 p-3 transition-colors active:bg-secondary/30 ${
                      isMe ? "bg-primary/15 ring-1 ring-primary/30" : pos <= 3 ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="relative w-8 flex-shrink-0">
                      {pos <= 3 && (
                        <FireCircle size="sm" intensity={pos === 1 ? "high" : "medium"} className="absolute -inset-1" />
                      )}
                      <span className={`relative z-10 font-unbounded text-lg font-black block text-center ${
                        pos <= 3 ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {pos}
                      </span>
                    </div>
                    
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                      {profile.avatar_url || '👨‍🍳'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {profile.display_name || 'Chef Anónimo'}
                        {isMe && <span className="ml-1 text-[10px] text-primary font-bold">(Tú)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{getLevel(profile.total_energy)}</p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="font-unbounded text-sm font-bold text-primary">{formatEnergy(profile.total_energy)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
                {selectedProfile.avatar_url || '👨‍🍳'}
              </div>
              
              <h3 className="font-unbounded text-lg font-bold mb-1">
                {selectedProfile.display_name || 'Chef Anónimo'}
              </h3>
              
              <p className="text-primary text-sm font-bold mb-2">
                Nivel {getLevel(selectedProfile.total_energy)}
              </p>
              
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-unbounded text-sm font-bold text-primary">
                  {formatEnergy(selectedProfile.total_energy)} energía
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                  {loadingStats ? (
                    <p className="text-xs text-muted-foreground">...</p>
                  ) : profileStats ? (
                    <>
                      <p className="font-unbounded font-bold">
                        {profileStats.triviaTotal > 0 
                          ? Math.round((profileStats.triviaCorrect / profileStats.triviaTotal) * 100) 
                          : 0}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Mini Retos</p>
                    </>
                  ) : null}
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <Video className="w-4 h-4 text-primary mx-auto mb-1" />
                  {loadingStats ? (
                    <p className="text-xs text-muted-foreground">...</p>
                  ) : profileStats ? (
                    <>
                      <p className="font-unbounded font-bold">
                        {profileStats.challengesCompleted}
                      </p>
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
              
              {(selectedProfile.instagram_handle || selectedProfile.tiktok_handle) && (
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-border">
                  {selectedProfile.instagram_handle && (
                    <a 
                      href={`https://instagram.com/${selectedProfile.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Instagram className="w-3 h-3" />
                      @{selectedProfile.instagram_handle}
                    </a>
                  )}
                  {selectedProfile.tiktok_handle && (
                    <a 
                      href={`https://tiktok.com/@${selectedProfile.tiktok_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
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
    </MobileAppLayout>
  );
};

export default AppRanking;
