import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { useEnrollment } from '@/hooks/useEnrollment';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { PresentationVideoCard } from '@/components/dashboard/PresentationVideoCard';
import { EnergyStats } from '@/components/dashboard/EnergyStats';
import { DailyTrivia } from '@/components/dashboard/DailyTrivia';
import { PastTrivias } from '@/components/dashboard/PastTrivias';
import { WeeklyChallenges } from '@/components/dashboard/WeeklyChallenges';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SuperLikeNotification } from '@/components/dashboard/SuperLikeNotification';
import { Button } from '@/components/ui/button';
import { Loader2, Video, Shield } from 'lucide-react';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, uploadAvatar, refetch } = useProfile();
  const { isAdmin } = useAdmin();
  const { isEnrolled } = useEnrollment();
  const navigate = useNavigate();
  const [localEnergy, setLocalEnergy] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setLocalEnergy(profile.total_energy);
    }
  }, [profile]);

  const handleEnergyEarned = (amount: number) => {
    setLocalEnergy(prev => prev + amount);
    setTimeout(() => refetch(), 1000);
  };

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
          <SuperLikeNotification userId={user.id} />

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-unbounded text-2xl md:text-3xl font-bold mb-2 text-foreground">
                {t('dashboard.hello', { name: profile.display_name || 'Chef' })}
              </h1>
              <p className="text-muted-foreground">
                {t('dashboard.welcomeSubtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button asChild variant="default" className="gap-2 hidden md:flex">
                  <Link to="/admin">
                    <Shield className="w-4 h-4" />
                    {t('nav.admin')}
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="gap-2 hidden md:flex">
                <Link to="/videos">
                  <Video className="w-4 h-4" />
                  {t('dashboard.viewGallery')}
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <ProfileCard profile={profile} isEnrolled={isEnrolled} />
              <PresentationVideoCard />
              <EnergyStats totalEnergy={localEnergy} />
              <QuickActions />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="font-unbounded text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
                  {t('dashboard.dailyChallenge')}
                </h2>
                <DailyTrivia onEnergyEarned={handleEnergyEarned} />
              </div>

              <PastTrivias onEnergyEarned={handleEnergyEarned} />

              <div>
                <h2 className="font-unbounded text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
                  {t('dashboard.weeklyChallenges')}
                </h2>
                <WeeklyChallenges />
              </div>

              <Button asChild variant="outline" className="w-full gap-2 md:hidden">
                <Link to="/videos">
                  <Video className="w-4 h-4" />
                  {t('dashboard.viewVideoGallery')}
                </Link>
              </Button>

              <div className="feature-panel">
                <h3 className="font-unbounded font-bold mb-3 text-foreground">{t('dashboard.howToEarnTitle')}</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-center gap-2"><span className="text-primary">•</span>{t('dashboard.dailyOnTime')}</li>
                  <li className="flex items-center gap-2"><span className="text-primary">•</span>{t('dashboard.dailyLate')}</li>
                  <li className="flex items-center gap-2"><span className="text-primary">•</span>{t('dashboard.weeklyOnTime')}</li>
                  <li className="flex items-center gap-2"><span className="text-primary">•</span>{t('dashboard.weeklyLate')}</li>
                  <li className="flex items-center gap-2"><span className="text-primary">•</span>{t('dashboard.likesReceived')}</li>
                  <li className="flex items-center gap-2"><span className="text-primary">•</span>{t('dashboard.superLikeReceived')}</li>
                  <li className="flex items-center gap-2"><span className="text-primary">•</span>{t('dashboard.videoApproved')}</li>
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
