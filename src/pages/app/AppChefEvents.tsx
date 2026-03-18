import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { Loader2, ChefHat, Clock, Flame, CalendarDays, Tv } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

const AppChefEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  if (!user) {
    return (
      <MobileAppLayout>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center gap-5 min-h-[70vh]">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Tv className="w-10 h-10 text-white/20" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="app-section-title">Directos</h2>
            <p className="app-body-sm max-w-xs">
              Inicia sesión para ver los directos y cocinar en vivo con los chefs de El Reto 2026.
            </p>
          </div>
          <Link to="/app/auth" className="btn-primary w-full max-w-xs">
            Iniciar sesión
          </Link>
        </div>
      </MobileAppLayout>
    );
  }

  const liveEvents     = events.filter(e => e.status === 'live');
  const upcomingEvents = events.filter(e => e.status === 'published' && isFuture(new Date(e.scheduled_at)));
  const pastEvents     = events.filter(e => e.status === 'finished' || (e.status === 'published' && isPast(new Date(e.scheduled_at))));

  return (
    <MobileAppLayout>
      <AppHeader />

      {/* Hero */}
      <div className="px-4 pt-4 pb-6 text-center">
        <h1 className="app-hero">Directos</h1>
        <p className="app-body mt-2">Cocina en directo con chefs profesionales</p>
      </div>

      <div className="px-4 pb-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" strokeWidth={1.5} />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-white/10 rounded-2xl">
            <ChefHat className="w-12 h-12 text-white/20 mb-4" strokeWidth={1.5} />
            <h3 className="app-heading mb-2">Próximamente</h3>
            <p className="app-body-sm max-w-xs">Aún no hay eventos programados. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <>
            {liveEvents.length > 0 && (
              <section>
                <h2 className="app-heading flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  En directo
                </h2>
                <div className="space-y-3">
                  {liveEvents.map(event => <MobileEventCard key={event.id} event={event} />)}
                </div>
              </section>
            )}

            {upcomingEvents.length > 0 && (
              <section>
                <h2 className="app-heading flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  Próximos
                </h2>
                <div className="space-y-3">
                  {upcomingEvents.map(event => <MobileEventCard key={event.id} event={event} />)}
                </div>
              </section>
            )}

            {pastEvents.length > 0 && (
              <section>
                <h2 className="app-heading mb-3">Anteriores</h2>
                <div className="space-y-3">
                  {pastEvents.map(event => <MobileEventCard key={event.id} event={event} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </MobileAppLayout>
  );
};

const MobileEventCard = ({ event }: { event: any }) => {
  const isLive     = event.status === 'live';
  const isFinished = event.status === 'finished';

  return (
    <Link to={`/app/sigue-al-chef/${event.id}`}>
      <div className={`overflow-hidden rounded-2xl border transition-transform active:scale-[0.98] ${isLive ? 'border-destructive/30 ring-1 ring-destructive/20' : 'border-white/10'}`}>
        {event.cover_image_url && (
          <div className="h-32 overflow-hidden">
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-3 space-y-1.5 bg-card">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-destructive uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                LIVE
              </span>
            )}
            {isFinished && (
              <span className="text-[10px] font-medium text-white/40 border border-white/15 rounded-full px-2 py-0.5">
                Finalizado
              </span>
            )}
          </div>
          <h3 className="app-heading">{event.title}</h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 app-caption">
              <ChefHat className="w-3 h-3" strokeWidth={1.5} />{event.chef_name}
            </span>
            <span className="flex items-center gap-1 app-caption">
              <Clock className="w-3 h-3" strokeWidth={1.5} />{event.duration_minutes} min
            </span>
            <span className="flex items-center gap-1 app-caption text-primary">
              <Flame className="w-3 h-3" strokeWidth={1.5} />+{event.energy_reward}
            </span>
          </div>
          <p className="app-caption">
            {format(new Date(event.scheduled_at), "d MMM · HH:mm'h'", { locale: es })}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default AppChefEvents;
