import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MasterChefLogo } from "@/components/MasterChefLogo";
import { useMobileRedirect } from "@/hooks/useMobileRedirect";
import { useAuth } from "@/hooks/useAuth";
import { useEnrollment } from "@/hooks/useEnrollment";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight, Trophy, Play, Zap, Video, BookOpen,
  ChefHat, HelpCircle, Smartphone, Users, Flame
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  useMobileRedirect();
  const { user } = useAuth();
  const { isEnrolled } = useEnrollment();
  const [topProfiles, setTopProfiles] = useState<{ display_name: string | null; avatar_url: string | null; total_energy: number }[]>([]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('display_name, avatar_url, total_energy')
      .order('total_energy', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setTopProfiles(data); });
  }, []);

  const ctaHref = user && isEnrolled ? '/descarga' : '/inscripcion';
  const ctaLabel = user && isEnrolled ? 'Descargar App' : 'Inscribirme a El Reto';

  const phases = [
    { icon: Smartphone, title: "Fase 0: Casting (App)", desc: "Graba tu vídeo de presentación desde la App móvil." },
    { icon: ChefHat, title: "Fase 1: Mini Retos", desc: "Demuestra tu conocimiento culinario y acumula energía." },
    { icon: Video, title: "Fase 2: Desafíos", desc: "Cocina y sube tus vídeos semanales." },
    { icon: Trophy, title: "Fase 3: Final", desc: "Los mejores clasificados compiten por el título." },
  ];

  const faqs = [
    { q: "¿Qué es El Reto 2026?", a: "Es la competición gastronómica online más grande del mundo. Participas desde casa, subes vídeos y compites por premios reales." },
    { q: "¿Es gratis participar?", a: "Sí, la participación es completamente gratuita." },
    { q: "¿Necesito la App?", a: "Sí. La Fase 0 (vídeo casting) solo puede completarse desde la App móvil, ya que necesita acceso a cámara y micrófono." },
    { q: "¿Cómo funciona la energía?", a: "La energía se acumula completando retos, trivias y desafíos. Determina tu posición en el ranking." },
    { q: "¿Puedo participar desde cualquier país?", a: "Sí, El Reto es internacional y abierto a todos." },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">

        {/* ─── 1. Hero ─── */}
        <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden px-4 py-20">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 right-[10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute bottom-1/3 left-[5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
          </div>
          <div className="container relative z-10 max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="flex justify-center mb-8">
              <MasterChefLogo size="lg" />
            </motion.div>
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
              <span className="inline-block bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider rounded-full px-4 py-1.5 mb-6">
                Temporada 2026
              </span>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" custom={2} variants={fadeUp}
              className="font-unbounded text-4xl sm:text-5xl md:text-7xl font-black uppercase mb-6 text-foreground"
            >
              La mayor competición<br />
              <span className="text-gradient-primary">gastronómica</span><br />
              está de vuelta
            </motion.h1>
            <motion.p initial="hidden" animate="visible" custom={3} variants={fadeUp}
              className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-10"
            >
              Regístrate, inscríbete a El Reto y demuestra que la cocina es tu pasión.
            </motion.p>
            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
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
                  Ver Ranking
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ─── 2. ¿Qué es El Reto? ─── */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-6">¿Qué es El Reto?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                El Reto 2026 es la competición gastronómica online donde miles de personas compiten desde casa.
                Acumula energía, sube tus platos, escala en el ranking y demuestra tu talento culinario.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
              className="grid grid-cols-3 gap-6 mt-12 max-w-md mx-auto"
            >
              {[
                { icon: Users, label: "Miles de participantes" },
                { icon: Zap, label: "Sistema de progresión" },
                { icon: Trophy, label: "Premios reales" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── 3. Cómo funciona ─── */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold text-center mb-12">Cómo funciona</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {phases.map((phase, i) => (
                <motion.div key={phase.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <phase.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-unbounded text-base font-bold mb-2">{phase.title}</h3>
                  <p className="text-sm text-muted-foreground">{phase.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 4. Ranking teaser ─── */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container max-w-3xl mx-auto">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold text-center mb-8">Ranking en vivo</h2>
            <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
              {topProfiles.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">Cargando ranking...</p>
              ) : (
                <div className="divide-y divide-border">
                  {topProfiles.map((p, i) => (
                    <div key={i} className={`flex items-center gap-4 px-5 py-3 ${i < 3 ? 'bg-primary/5' : ''}`}>
                      <span className={`font-unbounded font-bold w-8 text-center ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg">{p.avatar_url || '👨‍🍳'}</div>
                      <span className="flex-1 font-medium truncate text-sm">{p.display_name || 'Chef Anónimo'}</span>
                      <span className="font-unbounded font-bold text-primary text-sm">{p.total_energy.toLocaleString('es-ES')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-center">
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/ranking">Ver ranking completo <ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ─── 5. Vídeos teaser ─── */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">Galería de vídeos</h2>
            <p className="text-muted-foreground mb-8">Los mejores platos de la comunidad</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[9/16] bg-muted rounded-2xl flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground/40" />
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/videos">Ver todos los vídeos <ChevronRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </section>

        {/* ─── 6. Recetario teaser ─── */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">El Recetario Eterno</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Digitaliza las recetas manuscritas de tu familia con inteligencia artificial. Guárdalas para siempre.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/recetario"><BookOpen className="w-5 h-5" /> Ir al Recetario</Link>
            </Button>
          </div>
        </section>

        {/* ─── 7. FAQ ─── */}
        <section className="py-20 px-4">
          <div className="container max-w-3xl mx-auto">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold text-center mb-10">
              <HelpCircle className="w-8 h-8 text-primary inline-block mr-2 -mt-1" />
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-medium text-sm">{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4">
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Sticky CTA ─── */}
        {!isEnrolled && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
            <Button asChild size="lg" className="shadow-xl gap-2 px-6">
              <Link to="/inscripcion">
                <Flame className="w-5 h-5" />
                Inscribirme a El Reto
              </Link>
            </Button>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default Index;
