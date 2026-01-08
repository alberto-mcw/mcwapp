import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useChallenges } from '@/hooks/useChallenges';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { EnergyStats } from '@/components/dashboard/EnergyStats';
import { ChallengeCard } from '@/components/dashboard/ChallengeCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, uploadAvatar } = useProfile();
  const { dailyChallenge, weeklyChallenge, loading: challengesLoading, completeChallenge, isChallengeCompleted } = useChallenges();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="font-unbounded text-2xl md:text-3xl font-bold mb-2">
              ¡Hola, <span className="text-gradient-fire">{profile.display_name || 'Chef'}</span>!
            </h1>
            <p className="text-muted-foreground">
              Bienvenido a tu zona de entrenamiento
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile & Stats */}
            <div className="lg:col-span-1 space-y-6">
              <ProfileCard profile={profile} onAvatarUpload={uploadAvatar} />
              <EnergyStats totalEnergy={profile.total_energy} />
              <QuickActions />
            </div>

            {/* Right Column - Challenges */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-unbounded text-xl font-bold flex items-center gap-2">
                🔥 Tus Retos
              </h2>

              {challengesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChallengeCard
                    type="daily"
                    challenge={dailyChallenge}
                    isCompleted={dailyChallenge ? isChallengeCompleted(dailyChallenge.id) : false}
                    onComplete={completeChallenge}
                  />
                  <ChallengeCard
                    type="weekly"
                    challenge={weeklyChallenge}
                    isCompleted={weeklyChallenge ? isChallengeCompleted(weeklyChallenge.id) : false}
                    onComplete={completeChallenge}
                  />
                </div>
              )}

              {/* Info Card */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-unbounded font-bold mb-3">📱 ¿Cómo ganar más energía?</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Completa los retos diarios y semanales
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Síguenos en Instagram para +50 energía
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Descarga la app para retos exclusivos
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
