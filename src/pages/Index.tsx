import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MasterChefLogo } from "@/components/MasterChefLogo";
import { useMobileRedirect } from "@/hooks/useMobileRedirect";
import { useAuth } from "@/hooks/useAuth";
import { useEnrollment } from "@/hooks/useEnrollment";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ChevronRight, Trophy, Play, Zap, Video, BookOpen,
  ChefHat, HelpCircle, Smartphone, Users, Flame } from
"lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

const Index = () => {
  useMobileRedirect();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isEnrolled } = useEnrollment();
  const [topProfiles, setTopProfiles] = useState<{display_name: string | null;avatar_url: string | null;total_energy: number;}[]>([]);

  useEffect(() => {
    supabase.
    from('profiles').
    select('display_name, avatar_url, total_energy').
    order('total_energy', { ascending: false }).
    limit(10).
    then(({ data }) => {if (data) setTopProfiles(data);});
  }, []);

  const ctaHref = user && isEnrolled ? '/descarga' : '/inscripcion';
  const ctaLabel = user && isEnrolled ? t('hero.ctaDownload') : t('hero.ctaEnroll');

  const phases = [
    { icon: Smartphone, title: t('howItWorks.phase0'), desc: t('howItWorks.phase0Desc') },
    { icon: ChefHat, title: t('howItWorks.phase1'), desc: t('howItWorks.phase1Desc') },
    { icon: Video, title: t('howItWorks.phase2'), desc: t('howItWorks.phase2Desc') },
    { icon: Trophy, title: t('howItWorks.phase3'), desc: t('howItWorks.phase3Desc') },
  ];

  const faqs = [
    { q: t('faqSection.q1'), a: t('faqSection.a1') },
    { q: t('faqSection.q2'), a: t('faqSection.a2') },
    { q: t('faqSection.q3'), a: t('faqSection.a3') },
    { q: t('faqSection.q4'), a: t('faqSection.a4') },
    { q: t('faqSection.q5'), a: t('faqSection.a5') },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header showLanguageSelectorAlways />
      <main className="pt-16">

        {/* ─── 1. Hero ─── */}
        <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden px-4 py-20">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 right-[10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute bottom-1/3 left-[5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
          </div>
          <div className="container relative z-10 max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex justify-center mb-8">
              <MasterChefLogo size="lg" variant="vertical" />
            </motion.div>
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
              <span className="inline-block bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider rounded-full px-4 py-1.5 mb-6">
                 {t('hero.edition')}
              </span>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="font-unbounded text-4xl sm:text-5xl md:text-7xl font-black uppercase mb-6 text-foreground">
              {t('hero.headline1')}<br />
              <span className="text-gradient-primary">{t('hero.headline2')}</span><br />
              {t('hero.headline3')}
            </motion.h1>
            <motion.p initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-10">
              {t('hero.subtitle')}
            </motion.p>
            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto px-8 py-6 text-base gap-2">
                <Link to={ctaHref}>
                  <Flame className="w-5 h-5" />
                  {ctaLabel}
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base gap-2">
                <Link to="/ranking">
                  <Trophy className="w-5 h-5" />
                  {t('hero.ctaRanking')}
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ─── 2. ¿Qué es El Reto? ─── */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-6">{t('whatIs.title')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                {t('whatIs.description')}
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
            className="grid grid-cols-3 gap-6 mt-12 max-w-md mx-auto">
              {[
                { icon: Users, label: t('whatIs.participants') },
                { icon: Zap, label: t('whatIs.progression') },
                { icon: Trophy, label: t('whatIs.prizes') },
              ].map(({ icon: Icon, label }) =>
                <div key={label} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ─── 3. Cómo funciona ─── */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold text-center mb-12">{t('howItWorks.title')}</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {phases.map((phase, i) =>
                <motion.div key={phase.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <phase.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-unbounded text-base font-bold mb-2">{phase.title}</h3>
                  <p className="text-sm text-muted-foreground">{phase.desc}</p>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* ─── 4. Ranking teaser ─── */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container max-w-3xl mx-auto">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold text-center mb-2">{t('rankingSection.title')}</h2>
            <p className="text-center text-muted-foreground text-sm mb-8">{t('rankingSection.subtitle')}</p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
              {topProfiles.length === 0 ?
                <p className="py-12 text-center text-muted-foreground">{t('rankingSection.loading')}</p> :
                <div className="divide-y divide-border">
                  {topProfiles.map((p, i) =>
                    <div key={i} className={`flex items-center gap-4 px-5 py-3 ${i < 3 ? 'bg-primary/5' : ''}`}>
                      <span className={`font-unbounded font-bold w-8 text-center ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg">{p.avatar_url || '👨‍🍳'}</div>
                      <span className="flex-1 font-medium truncate text-sm">{p.display_name || t('rankingSection.anonymousChef')}</span>
                      <span className="font-unbounded font-bold text-primary text-sm">{p.total_energy.toLocaleString('es-ES')}</span>
                    </div>
                  )}
                </div>
              }
            </div>
            <div className="text-center">
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/ranking">{t('rankingSection.viewFull')} <ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ─── 5. Vídeos teaser ─── */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">{t('videosSection.title')}</h2>
            <p className="text-muted-foreground mb-8">{t('videosSection.subtitle')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) =>
                <div key={i} className="aspect-[9/16] bg-muted rounded-2xl flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/videos">{t('videosSection.viewAll')} <ChevronRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </section>

        {/* ─── 6. Recetario teaser ─── */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">{t('recetarioSection.title')}</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {t('recetarioSection.description')}
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/recetario"><BookOpen className="w-5 h-5" /> {t('recetarioSection.cta')}</Link>
            </Button>
          </div>
        </section>

        {/* ─── 7. FAQ ─── */}
        <section id="faq" className="py-20 px-4 scroll-mt-20">
          <div className="container max-w-3xl mx-auto">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold text-center mb-10">
              <HelpCircle className="w-8 h-8 text-primary inline-block mr-2 -mt-1" />
              {t('faqSection.title')}
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) =>
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left">
                    <span className="font-medium text-sm">{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  {openFaq === i &&
                    <div className="px-6 pb-4">
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  }
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Sticky CTA ─── */}
        {!isEnrolled &&
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
            <Button asChild size="lg" className="shadow-xl gap-2 px-6">
              <Link to="/inscripcion">
                <Flame className="w-5 h-5" />
                {t('hero.ctaEnroll')}
              </Link>
            </Button>
          </div>
        }

      </main>
      <Footer />
    </div>);
};

export default Index;
