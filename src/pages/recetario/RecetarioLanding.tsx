import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Sparkles, Download, Heart, ArrowRight, UtensilsCrossed, ChefHat, BookOpen, Star, Users, Image, Mic, Link, FileText, Video } from "lucide-react";
import recetaEjemploImg from "@/assets/receta-ejemplo.jpg";

const uploadMethods = [
  { icon: Image, title: "Foto", desc: "Haz una foto a la receta manuscrita o de un libro", emoji: "📸", color: "from-amber-500/20 to-orange-500/20" },
  { icon: FileText, title: "PDF", desc: "Sube un PDF con tus recetas favoritas", emoji: "📄", color: "from-blue-500/20 to-indigo-500/20" },
  { icon: Mic, title: "Audio", desc: "Dicta la receta con tu voz o sube una grabación", emoji: "🎙️", color: "from-rose-500/20 to-pink-500/20" },
  { icon: Link, title: "Enlace", desc: "Pega un enlace de YouTube, Instagram o TikTok", emoji: "🔗", color: "from-emerald-500/20 to-teal-500/20" },
  { icon: Video, title: "Vídeo", desc: "Sube un vídeo y la IA extrae la receta completa", emoji: "🎬", color: "from-violet-500/20 to-purple-500/20" },
  { icon: Camera, title: "Texto", desc: "Escribe o pega directamente el texto de la receta", emoji: "✍️", color: "from-cyan-500/20 to-sky-500/20" },
];
import { Button } from "@/components/ui/button";
import { RecetarioAccountMenu } from "@/components/recetario/RecetarioAccountMenu";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const } }),
};

const steps = [
  { icon: Camera, title: "Sube tu receta", desc: "Haz una foto de la receta manuscrita de tu abuela o de cualquier libro antiguo.", emoji: "📸" },
  { icon: Sparkles, title: "La IA la digitaliza", desc: "Nuestra inteligencia artificial lee, interpreta y estructura la receta completa.", emoji: "✨" },
  { icon: Download, title: "Tu recetario eterno", desc: "Descarga un PDF premium, ajusta raciones, genera lista de la compra y comparte.", emoji: "📖" },
];

const benefits = [
  { icon: Sparkles, text: "Digitalización con IA avanzada" },
  { icon: Users, text: "Ajuste de raciones (2-8 personas)" },
  { icon: BookOpen, text: "Lista de la compra organizada" },
  { icon: Star, text: "Alternativas de ingredientes" },
  { icon: Heart, text: "Versión saludable automática" },
  { icon: Download, text: "PDF premium descargable" },
  { icon: BookOpen, text: "Biblioteca privada ilimitada" },
  { icon: ArrowRight, text: "Compartir con enlace único" },
];

const testimonials = [
  { name: "María G.", text: "He digitalizado las 47 recetas de mi abuela. Ahora las tiene toda la familia.", avatar: "👩‍🍳" },
  { name: "Carlos R.", text: "Increíble cómo lee la letra de mi madre. Hasta las manchas de aceite las esquiva.", avatar: "👨‍🍳" },
  { name: "Ana P.", text: "El PDF queda precioso. Lo he impreso y regalado por Navidad.", avatar: "👩‍🦰" },
];

export default function RecetarioLanding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const handleCTA = () => {
    if (user) {
      navigate("/recetario/subir");
      return;
    }
    const params = new URLSearchParams();
    const utm_source = searchParams.get("utm_source");
    const utm_medium = searchParams.get("utm_medium");
    const utm_campaign = searchParams.get("utm_campaign");
    const ref = searchParams.get("ref");
    if (utm_source) params.set("utm_source", utm_source);
    if (utm_medium) params.set("utm_medium", utm_medium);
    if (utm_campaign) params.set("utm_campaign", utm_campaign);
    if (ref) params.set("ref", ref);
    navigate(`/recetario/captura?${params.toString()}`);
  };

  return (
    <div className="min-h-screen recetario-vichy-bg text-recetario-fg overflow-x-hidden">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between max-w-5xl mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs sm:text-sm text-recetario-muted hover:text-recetario-primary transition-colors font-medium flex items-center gap-1">
            {t('recetarioLanding.back')}
          </a>
          <img src="/images/recetario-logo.png" alt="Mi Recetario Eterno" className="h-44 sm:h-40 w-auto object-contain -my-12" />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            className="text-recetario-primary hover:text-recetario-primary-hover text-xs sm:text-sm font-medium px-2 sm:px-4"
            onClick={() => navigate("/recetario/biblioteca")}
          >
            {t('recetarioLanding.myLibrary')}
          </Button>
          <RecetarioAccountMenu />
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-8 sm:pt-16 pb-12 sm:pb-20 max-w-3xl mx-auto text-center">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-recetario-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-recetario-primary/8 blur-3xl" />
        </div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="inline-flex items-center gap-2 bg-recetario-primary/10 text-recetario-primary px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 border border-recetario-primary/20">
          <Heart className="w-3.5 h-3.5 fill-recetario-primary" />
          {t('recetarioLanding.badge')}
        </motion.div>

        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="font-display text-[2rem] sm:text-4xl md:text-6xl font-bold leading-[1.08] mb-5 sm:mb-6 text-recetario-fg">
          {t('recetarioLanding.heroTitle1')}{" "}
          <span className="relative inline-block">
            <span className="text-recetario-primary">{t('recetarioLanding.heroTitle2')}</span>
            <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
              <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--recetario-primary))" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </span>
        </motion.h1>

        <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-base sm:text-lg md:text-xl text-recetario-muted max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed font-body">
          {t('recetarioLanding.heroSubtitle')}
        </motion.p>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button onClick={handleCTA}
            className="bg-recetario-primary hover:bg-recetario-primary-hover text-white text-base sm:text-lg px-8 py-6 rounded-full shadow-lg shadow-recetario-primary/25 transition-all hover:shadow-xl hover:shadow-recetario-primary/30 hover:scale-[1.02] w-full sm:w-auto">
            {t('recetarioLanding.ctaMain')}
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <span className="text-xs text-recetario-muted-light font-body">{t('recetarioLanding.ctaNote')}</span>
        </motion.div>
      </section>

      {/* Before/After Visual */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-20 max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} custom={0}
          className="relative grid md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          {/* Before */}
          <div className="relative bg-recetario-surface/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-recetario-border text-center group hover:border-recetario-primary/30 transition-colors">
            <div className="absolute top-4 left-4 bg-recetario-muted-light/20 text-recetario-muted text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full font-display">{t('recetarioLanding.before')}</div>
            <div className="mt-6 mb-3">
              <p className="font-display text-base sm:text-lg text-recetario-muted mb-1">{t('recetarioLanding.handwrittenRecipe')}</p>
              <p className="text-xs sm:text-sm text-recetario-muted-light font-body">{t('recetarioLanding.handwrittenDesc')}</p>
            </div>
            <div className="h-44 sm:h-56 rounded-xl overflow-hidden shadow-inner">
              <img src={recetaEjemploImg} alt="Receta manuscrita antigua - Compota de Victoria" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          {/* Arrow connector (desktop) */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-recetario-primary text-white items-center justify-center shadow-lg shadow-recetario-primary/30">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* After — Desktop mockup */}
          <div className="relative bg-recetario-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-recetario-border/60 group hover:shadow-2xl transition-shadow">
            <div className="absolute top-4 left-4 bg-recetario-primary/10 text-recetario-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full font-display">Después</div>
            <div className="mt-6 mb-4">
              <p className="font-display text-base sm:text-lg text-recetario-fg font-bold mb-1">✨ Receta digitalizada</p>
              <p className="text-xs sm:text-sm text-recetario-muted-light font-body">Ingredientes, pasos, raciones, lista de la compra...</p>
            </div>
            {/* Desktop mockup frame */}
            <div className="bg-recetario-fg rounded-xl overflow-hidden shadow-lg">
              {/* Browser bar */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-recetario-fg border-b border-white/10">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                <div className="flex-1 mx-2 bg-white/10 rounded-md px-3 py-0.5 text-[9px] text-white/40 font-body truncate">mirecetarioeterno.com/receta/compota-de-victoria</div>
              </div>
              {/* Recipe content inside mockup */}
              <div className="bg-recetario-bg p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-recetario-primary flex-shrink-0" />
                  <span className="font-semibold font-display text-sm sm:text-base text-recetario-fg">Compota de Victoria</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-recetario-muted font-body">
                  <span className="bg-recetario-primary/10 text-recetario-primary px-2 py-0.5 rounded-full">⏱ 45 min</span>
                  <span className="bg-recetario-surface px-2 py-0.5 rounded-full">Fácil</span>
                  <span className="bg-recetario-surface px-2 py-0.5 rounded-full">4 personas</span>
                </div>
                <div className="text-xs text-recetario-muted font-body leading-relaxed">
                  <p className="font-semibold text-recetario-fg mb-1">Ingredientes:</p>
                  <p>Manzanas Victoria, canela, azúcar, huevos, harina, mantequilla, almíbar...</p>
                </div>
                <div className="flex gap-2 pt-1">
                  {["Ingredientes", "Pasos", "Compra", "PDF"].map(t => (
                    <span key={t} className="text-[10px] font-medium bg-recetario-card border border-recetario-border px-2.5 py-1 rounded-full text-recetario-muted">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Upload Methods */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24 max-w-4xl mx-auto">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-center mb-3 text-recetario-fg">
          Sube tu receta como quieras
        </motion.h2>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5}
          className="text-sm sm:text-base text-recetario-muted font-body text-center mb-8 sm:mb-12 max-w-md mx-auto">
          Foto, audio, vídeo, PDF, enlace o texto. Tú eliges el formato, la IA hace el resto.
        </motion.p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {uploadMethods.map((method, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5 + 1}
              className="relative bg-recetario-card rounded-2xl p-4 sm:p-5 border border-recetario-border/60 shadow-sm hover:shadow-lg hover:border-recetario-primary/30 transition-all group cursor-pointer"
              onClick={handleCTA}>
              <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <span className="text-xl sm:text-2xl">{method.emoji}</span>
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold text-recetario-fg mb-0.5">{method.title}</h3>
              <p className="text-[11px] sm:text-xs text-recetario-muted font-body leading-relaxed">{method.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24 max-w-4xl mx-auto">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-center mb-10 sm:mb-14 text-recetario-fg">
          Tres pasos. Así de fácil.
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              className="text-center group">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5">
                <div className="absolute inset-0 bg-recetario-primary/10 rounded-2xl sm:rounded-3xl group-hover:bg-recetario-primary/15 transition-colors rotate-3 group-hover:rotate-6" />
                <div className="relative w-full h-full bg-recetario-card rounded-2xl sm:rounded-3xl border border-recetario-border flex items-center justify-center shadow-sm">
                  <span className="text-2xl sm:text-3xl">{step.emoji}</span>
                </div>
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-recetario-primary mb-1.5 font-display uppercase tracking-wider">Paso {i + 1}</div>
              <h3 className="font-display text-base sm:text-lg font-bold mb-1.5 text-recetario-fg">{step.title}</h3>
              <p className="text-xs sm:text-sm text-recetario-muted leading-relaxed font-body max-w-[240px] mx-auto">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24 max-w-4xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="text-center mb-8 sm:mb-10">
          <div className="flex justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-recetario-primary text-recetario-primary" />)}
          </div>
          <p className="text-xs sm:text-sm text-recetario-muted font-body">Miles de familias ya preservan sus recetas</p>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              className="bg-recetario-card rounded-2xl p-5 sm:p-6 border border-recetario-border/60 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-recetario-fg font-body leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{t.avatar}</span>
                <span className="text-xs font-semibold text-recetario-muted font-display">{t.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24 max-w-4xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="bg-recetario-fg rounded-3xl p-6 sm:p-8 md:p-12 text-recetario-bg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-recetario-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-center relative">Todo lo que incluye</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative">
            {benefits.map((b, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-recetario-primary/20 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-4 h-4 text-recetario-primary" />
                </div>
                <span className="text-sm font-body">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Qué cocino hoy CTA */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-20 max-w-4xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="relative bg-gradient-to-br from-recetario-primary/5 via-recetario-surface/50 to-recetario-primary/10 border border-recetario-primary/15 rounded-3xl p-6 sm:p-8 md:p-10 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-recetario-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-recetario-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-recetario-primary/20">
              <UtensilsCrossed className="w-7 h-7 sm:w-8 sm:h-8 text-recetario-primary" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-recetario-fg mb-2 sm:mb-3">¿Qué cocino hoy?</h2>
            <p className="text-sm sm:text-base text-recetario-muted font-body mb-5 sm:mb-6 max-w-md mx-auto">
              Sube una foto de tu nevera o escribe tus ingredientes y te sugerimos recetas perfectas.
            </p>
            <Button onClick={() => navigate("/recetario/que-cocino")}
              className="bg-recetario-primary hover:bg-recetario-primary-hover text-white text-base sm:text-lg px-8 py-6 rounded-full shadow-lg shadow-recetario-primary/25 hover:scale-[1.02] transition-all">
              Descubrir recetas
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-20 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <p className="font-display text-lg sm:text-xl md:text-2xl text-recetario-muted mb-5 sm:mb-6 max-w-lg mx-auto leading-snug">
            Cada receta manuscrita es un tesoro.<br />No dejes que se pierda.
          </p>
          <Button onClick={handleCTA}
            className="bg-recetario-primary hover:bg-recetario-primary-hover text-white text-base sm:text-lg px-8 py-6 rounded-full shadow-lg shadow-recetario-primary/25 hover:scale-[1.02] transition-all">
            Digitalizar mi receta
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-recetario-border text-center text-xs sm:text-sm text-recetario-muted-light font-body">
        <p>El Recetario Eterno · Preservando la memoria culinaria familiar</p>
      </footer>
    </div>
  );
}
