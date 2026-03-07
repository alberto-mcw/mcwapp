import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { SectionTitle } from '@/components/app/SectionTitle';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { DailyTrivia } from '@/components/dashboard/DailyTrivia';
import { PastTrivias } from '@/components/dashboard/PastTrivias';
import { WeeklyChallenges } from '@/components/dashboard/WeeklyChallenges';
import { SuperLikeNotification } from '@/components/dashboard/SuperLikeNotification';
import { Zap } from 'lucide-react';

const AppChallenges = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [localEnergy, setLocalEnergy] = useState(0);

  useEffect(() => {
    if (profile) {
      setLocalEnergy(profile.total_energy);
    }
  }, [profile]);

  const handleEnergyEarned = (amount: number) => {
    setLocalEnergy(prev => prev + amount);
    setTimeout(() => refetch(), 1000);
  };


  return (
    <MobileAppLayout>
      {user && <SuperLikeNotification userId={user.id} />}
      
      <AppHeader />
      <SectionTitle
        topLabel={`Hola,`}
        title={profile?.display_name || 'Chef'}
        subtitle="Bienvenido a tu zona de entrenamiento"
      />

      <div className="px-4 py-4 space-y-6">
        {/* Energy Summary Card */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center glow-warm">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Tus puntos</p>
                <p className="text-2xl font-black text-primary tabular-nums">
                  {localEnergy.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Trivia */}
        <section>
          <h2 className="font-unbounded text-base font-bold flex items-center gap-2 mb-3 text-foreground">
            ⚡ Mini reto diario
          </h2>
          <DailyTrivia onEnergyEarned={handleEnergyEarned} />
        </section>

        {/* Past Trivias */}
        <PastTrivias onEnergyEarned={handleEnergyEarned} />

        {/* Weekly Challenges */}
        <section>
          <h2 className="font-unbounded text-base font-bold flex items-center gap-2 mb-3 text-foreground">
            🏆 Desafíos semanales
          </h2>
          <WeeklyChallenges />
        </section>

        {/* Info Card */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-unbounded text-sm font-bold mb-3 text-foreground">📱 ¿Cómo ganar más puntos?</h3>
          <ul className="space-y-2 text-muted-foreground text-xs">
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Mini Reto Diario a tiempo: +30 acertando, +2 fallando
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Desafío Semanal a tiempo: +100 puntos
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              Recibir likes en tus vídeos: +1 por like
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              SuperLike recibido: +50 puntos
            </li>
          </ul>
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default AppChallenges;
