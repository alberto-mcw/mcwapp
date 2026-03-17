import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { SectionTitle } from '@/components/app/SectionTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChefHat, Clock, Flame, CalendarDays } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

const AppChefEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('chef_events')
        .select('*')
        .in('status', ['published', 'live', 'finished'])
        .order('scheduled_at', { ascending: false });
      setEvents(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const liveEvents = events.filter(e => e.status === 'live');
  const upcomingEvents = events.filter(e => e.status === 'published' && isFuture(new Date(e.scheduled_at)));
  const pastEvents = events.filter(e => e.status === 'finished' || (e.status === 'published' && isPast(new Date(e.scheduled_at))));

  return (
    <MobileAppLayout>
      <AppHeader />
      <div className="px-4 pt-2 pb-6 space-y-6">
        <SectionTitle title="Sigue al Chef" subtitle="Cocina en directo con chefs profesionales" />
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ChefHat className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-unbounded text-lg font-bold mb-2">Próximamente</h3>
              <p className="text-muted-foreground text-sm">Aún no hay eventos programados. ¡Vuelve pronto!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {liveEvents.length > 0 && (
              <section>
                <SectionTitle>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    En directo
                  </span>
                </SectionTitle>
                <div className="space-y-3">
                  {liveEvents.map(event => (
                    <MobileEventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {upcomingEvents.length > 0 && (
              <section>
                <SectionTitle>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Próximos
                  </span>
                </SectionTitle>
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <MobileEventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {pastEvents.length > 0 && (
              <section>
                <SectionTitle>Anteriores</SectionTitle>
                <div className="space-y-3">
                  {pastEvents.map(event => (
                    <MobileEventCard key={event.id} event={event} />
                  ))}
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
  const isLive = event.status === 'live';
  const isFinished = event.status === 'finished';

  return (
    <Link to={`/app/sigue-al-chef/${event.id}`}>
      <Card className={`overflow-hidden active:scale-[0.98] transition-transform ${isLive ? 'border-red-500/30 ring-1 ring-red-500/20' : ''}`}>
        {event.cover_image_url && (
          <div className="h-32 overflow-hidden">
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            {isLive && <Badge className="bg-red-500 text-white border-0 text-[10px]">🔴 LIVE</Badge>}
            {isFinished && <Badge variant="outline" className="text-[10px]">Finalizado</Badge>}
          </div>
          <h3 className="font-unbounded font-bold text-sm">{event.title}</h3>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" /> {event.chef_name}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.duration_minutes} min</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-primary" /> +{event.energy_reward}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(event.scheduled_at), "d MMM · HH:mm'h'", { locale: es })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AppChefEvents;
