import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { FireCircle } from '@/components/FireCircle';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';
import logoVertical from '@/assets/logo-elreto-vertical.svg';
import { useTranslation } from 'react-i18next';

const AppCalendar = () => {
  const { t } = useTranslation();

  const timelineEvents = [
    { period: t('timeline.janApr'),    title: t('timeline.registrationOpen'),  description: t('timeline.registrationDesc'),    status: 'active',   unlocked: true  },
    { period: t('timeline.afterReg'),  title: t('timeline.presentationVideo'), description: t('timeline.presentationDesc'),    status: 'upcoming', unlocked: true  },
    { period: t('timeline.continuous'),title: t('timeline.activeEnergy'),      description: t('timeline.activeEnergyDesc'),    status: 'upcoming', unlocked: true  },
    { period: t('timeline.always'),    title: t('timeline.liveRanking'),       description: t('timeline.liveRankingDesc'),     status: 'upcoming', unlocked: true  },
    { period: t('timeline.top1000'),   title: t('timeline.mysteryBox'),        description: t('timeline.mysteryBoxDesc'),      status: 'locked',   unlocked: false },
    { period: t('timeline.top100'),    title: t('timeline.liveEvent'),         description: t('timeline.liveEventDesc'),       status: 'locked',   unlocked: false },
    { period: t('timeline.top5'),      title: t('timeline.mcExperience'),      description: t('timeline.mcExperienceDesc'),    status: 'locked',   unlocked: false },
  ];

  return (
    <MobileAppLayout>
      <AppHeader />

      <div className="px-4 pt-4 pb-6 text-center">
        <img src={logoVertical} alt="El Reto" className="h-16 w-auto object-contain mx-auto mb-3" />
        <h1 className="app-hero">{t('appCalendar.title')}</h1>
        <p className="app-body-sm mt-2">{t('appCalendar.subtitle')}</p>
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
                    event.unlocked ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-white/10 text-white/30'
                  }`}>
                    {event.status === 'active' ? (
                      <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                    ) : event.unlocked ? (
                      <Unlock className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <Lock className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex-1 border rounded-2xl p-4 ${
                event.unlocked ? 'bg-card border-primary/30' : 'bg-white/3 border-white/8'
              }`}>
                <span className={`app-caption mb-1 block ${event.unlocked ? 'text-primary' : ''}`}>
                  {event.period}
                </span>
                <h3 className="text-sm font-semibold text-white mb-1">{event.title}</h3>
                <p className="app-body-sm">{event.description}</p>

                {!event.unlocked && (
                  <div className="mt-2 inline-flex items-center gap-1 app-caption bg-white/5 rounded-full px-2 py-0.5">
                    <Lock className="w-2.5 h-2.5" strokeWidth={1.5} />
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
