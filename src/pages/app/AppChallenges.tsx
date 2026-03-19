import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { DailyTrivia } from '@/components/dashboard/DailyTrivia';
import { PastTrivias } from '@/components/dashboard/PastTrivias';
import { WeeklyChallenges } from '@/components/dashboard/WeeklyChallenges';
import { SuperLikeNotification } from '@/components/dashboard/SuperLikeNotification';
import { Zap, Trophy, Flame, ChevronRight, TrendingUp, ChefHat, CalendarDays, Clock, Tv, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isFuture, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import logoVertical from '@/assets/logo-elreto-vertical.svg';
import concentricSvg from '@/assets/concentric-circles.svg';

const PHASES = [
  { num: '0', label: 'Casting App',         desc: 'Graba tu vídeo de presentación desde la app.' },
  { num: '1', label: 'Mini Retos',           desc: 'Demuestra tu conocimiento culinario y acumula puntos.' },
  { num: '2', label: 'Desafíos semanales',   desc: 'Cocina y sube tus vídeos cada semana.' },
  { num: '3', label: 'Final',                desc: 'Los mejores clasificados compiten por el título.' },
];

const FEATURES = [
  { Icon: Trophy,     label: 'Premios reales' },
  { Icon: TrendingUp, label: 'Progresión' },
  { Icon: ChefHat,    label: 'Miles de chefs' },
];

// Guest view — concentric circles fixed, fade on scroll
const GuestView = () => {
  const [bgOpacity, setBgOpacity] = useState(1);

  useEffect(() => {
    const onScroll = () =>
      setBgOpacity(Math.max(0, 1 - window.scrollY / 260));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Fixed background circles — fade on scroll */}
      <img
        src={concentricSvg}
        aria-hidden
        className="pointer-events-none fixed left-1/2 -translate-x-1/2 w-[200vw] max-w-[900px]"
        style={{
          opacity: bgOpacity,
          top: 'calc(-10% - 130px)',
          transition: 'opacity 80ms linear',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col" style={{ paddingTop: 'var(--sat)', zIndex: 10 }}>

        {/* ── Hero (above fold) ───────────────────── */}
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-6 gap-4">
          <img src={logoVertical} alt="El Reto" className="h-[21rem] w-auto object-contain" />

          <h1 className="app-hero">
            Enciende los fogones:<br />comienza El Reto
          </h1>

          <p className="app-body max-w-xs">
            La mayor competición gastronómica online. Acumula puntos, sube tus platos y demuestra tu talento culinario desde casa.
          </p>

          <Link to="/app/auth" className="btn-primary w-full mt-2">
            Únete a El Reto
          </Link>
        </div>

        {/* ── Scrollable sections ─────────────────── */}
        <div className="px-5 pb-28 space-y-10 pt-8">

          {/* ¿Qué es El Reto? */}
          <div className="space-y-4">
            <h2 className="app-hero" style={{ fontSize: '1.75rem', color: 'white', textShadow: 'none' }}>¿Qué es El Reto?</h2>
            <p className="app-body text-center">
              El Reto 2026 es la competición gastronómica online donde miles de personas compiten desde casa. Acumula puntos, sube tus platos, escala en el ranking y demuestra tu talento culinario.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FEATURES.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 py-4 border border-white/10 rounded-xl"
                >
                  <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  <span className="text-xs text-white/50 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cómo funciona */}
          <div className="space-y-4">
            <h2 className="app-hero" style={{ fontSize: '1.75rem', color: 'white', textShadow: 'none' }}>Cómo funciona</h2>
            <div className="space-y-2">
              {PHASES.map(({ num, label, desc }) => (
                <div
                  key={num}
                  className="flex items-center gap-3 border border-white/10 rounded-xl px-4 py-3"
                >
                  <span className="text-4xl font-bold text-primary/20 leading-none flex-shrink-0 w-8 text-center self-center">
                    {num}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                    <p className="text-xs text-white/50 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* La oportunidad — sin card, sin botón */}
          <div className="text-center space-y-3 px-2 pb-4">
            <Flame className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
            <h3 className="app-hero" style={{ fontSize: '1.75rem', color: 'white', textShadow: 'none' }}>
              15 aspirantes llegarán al casting televisado
            </h3>
            <p className="app-body">
              Tendrás <strong className="font-bold">4 oportunidades</strong> para completar las fases. Si lo logras, serás uno de los finalistas que optan a un puesto en MasterChef.
            </p>
            <div style={{ paddingTop: '2rem' }}>
              <Link to="/app/auth" className="btn-primary w-full">
                Únete a El Reto
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const DirectosEventCard = ({ event, fullWidth }: { event: any; fullWidth?: boolean }) => {
  const isLive     = event.status === 'live';
  const isFinished = event.status === 'finished';

  return (
    <Link to={`/app/sigue-al-chef/${event.id}`} className={fullWidth ? 'block w-full' : 'flex-shrink-0 w-64 block'}>
      <div className={`overflow-hidden rounded-2xl border transition-transform active:scale-[0.98] ${isLive ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border'}`}>
        {event.cover_image_url && (
          <div className="h-28 overflow-hidden">
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className={`p-3 space-y-1.5 ${isLive ? 'bg-gradient-to-b from-[#F3AD68] to-[#FC6B37]' : 'bg-card'}`}>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                LIVE
              </span>
            )}
            {isFinished && (
              <span className="text-[10px] font-medium text-white/40 border border-white/15 rounded-full px-2 py-0.5">
                Finalizado
              </span>
            )}
          </div>
          <h3 className={`app-heading line-clamp-2 leading-snug ${isLive ? 'text-black' : ''}`}>{event.title}</h3>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 app-caption ${isLive ? 'text-black/60' : ''}`}>
              <ChefHat className="w-3 h-3" strokeWidth={1.5} />{event.chef_name}
            </span>
            <span className={`flex items-center gap-1 app-caption ${isLive ? 'text-black/60' : ''}`}>
              <Clock className="w-3 h-3" strokeWidth={1.5} />{event.duration_minutes} min
            </span>
            <span className={`flex items-center gap-1 app-caption ${isLive ? 'text-black/70 font-bold' : 'text-primary'}`}>
              <Flame className="w-3 h-3" strokeWidth={1.5} />+{event.energy_reward}
            </span>
          </div>
          <p className={`app-caption ${isLive ? 'text-black/50' : ''}`}>
            {format(new Date(event.scheduled_at), "d MMM · HH:mm'h'", { locale: es })}
          </p>
        </div>
      </div>
    </Link>
  );
};

const DirectosSection = ({ userId }: { userId: string }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('chef_events')
        .select('*')
        .in('status', ['published', 'live', 'finished'])
        .order('scheduled_at', { ascending: false });
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, [userId]);

  const liveEvents     = events.filter(e => e.status === 'live');
  const upcomingEvents = events.filter(e => e.status === 'published' && isFuture(new Date(e.scheduled_at)));
  const pastEvents     = events.filter(e => e.status === 'finished' || (e.status === 'published' && isPast(new Date(e.scheduled_at))));

  return (
    <section>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        <Tv className="w-4 h-4 text-primary" strokeWidth={1.5} />
        Directos
      </h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" strokeWidth={1.5} />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-border rounded-2xl">
          <ChefHat className="w-10 h-10 text-white/20 mb-3" strokeWidth={1.5} />
          <p className="app-body-sm">Próximamente — ¡Vuelve pronto!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {liveEvents.length > 0 && (
            <div>
              <p className="flex items-center gap-2 app-caption text-white/50 mb-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                En directo
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {liveEvents.map(e => <DirectosEventCard key={e.id} event={e} />)}
              </div>
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <div>
              <p className="flex items-center gap-2 app-caption text-white/50 mb-2">
                <CalendarDays className="w-3 h-3 text-primary" strokeWidth={1.5} />
                Próximos
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {upcomingEvents.map(e => <DirectosEventCard key={e.id} event={e} />)}
              </div>
            </div>
          )}
          {pastEvents.length > 0 && (
            <div>
              <p className="app-caption text-white/50 mb-2">Anterior</p>
              <DirectosEventCard event={pastEvents[0]} fullWidth />
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const AppChallenges = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [localEnergy, setLocalEnergy] = useState(0);

  useEffect(() => {
    if (profile) setLocalEnergy(profile.total_energy);
  }, [profile]);

  const handleEnergyEarned = (amount: number) => {
    setLocalEnergy(prev => prev + amount);
    setTimeout(() => refetch(), 1000);
  };

  if (!user) {
    return (
      <MobileAppLayout>
        <GuestView />
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <SuperLikeNotification userId={user.id} />
      <AppHeader />
      <div className="px-4 py-4 space-y-6">

        {/* Energy + Ranking */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-7 h-7 text-primary fill-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tus puntos</p>
                <p className="text-2xl font-bold text-primary tabular-nums">{localEnergy.toLocaleString()}</p>
              </div>
            </div>
            <Link to="/app/ranking" className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Trophy className="w-5 h-5" />
              Ranking
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Directos */}
        <DirectosSection userId={user.id} />

        {/* Daily Trivia */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            <Zap className="w-4 h-4 text-primary" />
            Mini reto del día
          </h2>
          <DailyTrivia onEnergyEarned={handleEnergyEarned} />
        </section>

        <PastTrivias onEnergyEarned={handleEnergyEarned} />

        {/* Weekly Challenges */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            <Trophy className="w-4 h-4 text-primary" />
            Desafíos semanales
          </h2>
          <WeeklyChallenges />
        </section>

        {/* Points guide */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-foreground">¿Cómo ganar más puntos?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              { pts: '+30',  desc: 'Mini Reto Diario acertado' },
              { pts: '+100', desc: 'Desafío Semanal completado' },
              { pts: '+1',   desc: 'Like recibido en tu vídeo' },
              { pts: '+50',  desc: 'SuperLike recibido' },
            ].map(({ pts, desc }) => (
              <li key={desc} className="flex items-center gap-3">
                <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 tabular-nums min-w-[40px] text-center">{pts}</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </MobileAppLayout>
  );
};

export default AppChallenges;
