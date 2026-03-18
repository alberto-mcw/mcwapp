import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FireCircle } from "@/components/FireCircle";
import { Calendar, CheckCircle2, Lock, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";

const Calendario = () => {
  const { t } = useTranslation();

  const timelineEvents = [
    {
      period: t('timeline.janApr'),
      title: t('timeline.registrationOpen'),
      description: t('timeline.registrationDesc'),
      status: "active",
      unlocked: true,
    },
    {
      period: t('timeline.afterReg'),
      title: t('timeline.presentationVideo'),
      description: t('timeline.presentationDesc'),
      status: "upcoming",
      unlocked: true,
    },
    {
      period: t('timeline.continuous'),
      title: t('timeline.activeEnergy'),
      description: t('timeline.activeEnergyDesc'),
      status: "upcoming",
      unlocked: true,
    },
    {
      period: t('timeline.always'),
      title: t('timeline.liveRanking'),
      description: t('timeline.liveRankingDesc'),
      status: "upcoming",
      unlocked: true,
    },
    {
      period: t('timeline.top1000'),
      title: t('timeline.mysteryBox'),
      description: t('timeline.mysteryBoxDesc'),
      status: "locked",
      unlocked: false,
    },
    {
      period: t('timeline.top100'),
      title: t('timeline.liveEvent'),
      description: t('timeline.liveEventDesc'),
      status: "locked",
      unlocked: false,
    },
    {
      period: t('timeline.top5'),
      title: t('timeline.mcExperience'),
      description: t('timeline.mcExperienceDesc'),
      status: "locked",
      unlocked: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('appCalendar.title')}</span>
            </div>
            
            <h1 className="font-unbounded text-4xl md:text-6xl font-black uppercase mb-4">
              {t('appCalendar.title')}
            </h1>
            
            <p className="text-muted-foreground max-w-xl mx-auto">{t('appCalendar.subtitle')}</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-border" />
              
              {timelineEvents.map((event, index) => (
                <div 
                  key={index}
                  className={`relative flex items-start gap-6 mb-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                    <div className="relative">
                      {event.unlocked && (
                        <FireCircle 
                          size="sm" 
                          intensity={event.status === "active" ? "high" : "low"} 
                          className="absolute -inset-3" 
                        />
                      )}
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                        event.unlocked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                        {event.status === "active" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : event.unlocked ? (
                          <Unlock className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`ml-20 md:ml-0 md:w-[calc(50%-3rem)] ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                    <div className={`bg-card border rounded-xl p-6 ${event.unlocked ? "border-primary/30" : "border-border"}`}>
                      <span className={`inline-block text-xs font-bold uppercase tracking-wider mb-2 ${event.unlocked ? "text-primary" : "text-muted-foreground"}`}>
                        {event.period}
                      </span>
                      <h3 className="font-unbounded text-xl font-bold mb-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      
                      {!event.unlocked && (
                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-full px-3 py-1">
                          <Lock className="w-3 h-3" />
                          {t('timeline.byRanking')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:block md:w-[calc(50%-3rem)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Calendario;
