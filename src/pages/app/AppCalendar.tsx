import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { FireCircle } from '@/components/FireCircle';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';
import logoVerticalLight from '@/assets/logo-vertical-light.png';
import { useTranslation } from 'react-i18next';

const AppCalendar = () => {
  const { t } = useTranslation();

  const timelineEvents = [
    {
      period: t('timeline.janApr'),
      title: t('timeline.registrationOpen'),
      description: t('timeline.registrationDesc'),
      status: 'active',
      unlocked: true,
    },
    {
      period: t('timeline.afterReg'),
      title: t('timeline.presentationVideo'),
      description: t('timeline.presentationDesc'),
      status: 'upcoming',
      unlocked: true,
    },
    {
      period: t('timeline.continuous'),
      title: t('timeline.activeEnergy'),
      description: t('timeline.activeEnergyDesc'),
      status: 'upcoming',
      unlocked: true,
    },
    {
      period: t('timeline.always'),
      title: t('timeline.liveRanking'),
      description: t('timeline.liveRankingDesc'),
      status: 'upcoming',
      unlocked: true,
    },
    {
      period: t('timeline.top1000'),
      title: t('timeline.mysteryBox'),
      description: t('timeline.mysteryBoxDesc'),
      status: 'locked',
      unlocked: false,
    },
    {
      period: t('timeline.top100'),
      title: t('timeline.liveEvent'),
      description: t('timeline.liveEventDesc'),
      status: 'locked',
      unlocked: false,
    },
    {
      period: t('timeline.top5'),
      title: t('timeline.mcExperience'),
      description: t('timeline.mcExperienceDesc'),
      status: 'locked',
      unlocked: false,
    },
  ];

  return (
    <MobileAppLayout>
      <AppHeader />

      <div className="px-4 pt-4 pb-6">
        <div className="flex flex-col items-center text-center">
          <img
            src={logoVerticalLight}
            alt="El Reto"
            className="h-20 w-auto object-contain mb-3"
          />
          <h1 className="text-2xl font-bold text-gradient-primary leading-tight">
            {t('appCalendar.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">{t('appCalendar.subtitle')}</p>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-border" />
          
          {timelineEvents.map((event, index) => (
            <div key={index} className="relative flex items-start gap-4 mb-4">
              <div className="relative z-10 flex-shrink-0">
                <div className="relative">
                  {event.unlocked && event.status === 'active' && (
                    <FireCircle size="sm" intensity="high" className="absolute -inset-2" />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    event.unlocked 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {event.status === 'active' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : event.unlocked ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex-1 bg-card border rounded-2xl p-4 ${
                event.unlocked ? 'border-primary/30' : 'border-border'
              }`}>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  event.unlocked ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {event.period}
                </span>
                <h3 className="text-sm font-bold mb-1">{event.title}</h3>
                <p className="text-xs text-muted-foreground">{event.description}</p>
                
                {!event.unlocked && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    {t('timeline.byRanking')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default AppCalendar;
