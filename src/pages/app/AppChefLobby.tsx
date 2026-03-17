import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { SecondaryHeader } from '@/components/app/SecondaryHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ChefHat, Clock, Flame, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AppChefLobby = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [participation, setParticipation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      const diff = new Date(event.scheduled_at).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('¡Ya ha empezado!');
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  useEffect(() => {
    if (user && id) checkParticipation();
  }, [user, id]);

  const fetchEvent = async () => {
    const [{ data: ev }, { data: st }] = await Promise.all([
      supabase.from('chef_events').select('*').eq('id', id!).single(),
      supabase.from('chef_event_steps').select('*').eq('event_id', id!).order('step_number'),
    ]);
    setEvent(ev);
    setSteps(st || []);
    setLoading(false);
  };

  const checkParticipation = async () => {
    const { data } = await supabase
      .from('chef_event_participants')
      .select('*')
      .eq('event_id', id!)
      .eq('user_id', user!.id)
      .maybeSingle();
    setParticipation(data);
  };

  const handleJoin = async () => {
    if (!user) { navigate('/app/auth'); return; }
    setJoining(true);
    const { data, error } = await supabase
      .from('chef_event_participants')
      .insert({ event_id: id!, user_id: user.id })
      .select()
      .single();
    if (!error) setParticipation(data);
    setJoining(false);
  };

  const handleEnterLive = () => navigate(`/app/sigue-al-chef/${id}/live`);

  if (loading || authLoading) {
    return (
      <MobileAppLayout showNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileAppLayout>
    );
  }

  if (!event) {
    return (
      <MobileAppLayout showNav={false}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Evento no encontrado</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/app/sigue-al-chef')}>
            Volver
          </Button>
        </div>
      </MobileAppLayout>
    );
  }

  const ingredients = Array.isArray(event.ingredients) ? event.ingredients : [];
  const utensils = Array.isArray(event.utensils) ? event.utensils : [];
  const isLiveOrPast = event.status === 'live' || event.status === 'finished';

  return (
    <MobileAppLayout showNav={false}>
      <SecondaryHeader title={event.title} onBack={() => navigate('/app/sigue-al-chef')} />
      
      {/* Cover */}
      <div className="relative">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt="" className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-primary/30" />
          </div>
        )}
        {event.status === 'live' && (
          <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground border-0">🔴 EN DIRECTO</Badge>
        )}
      </div>

      <div className="px-4 pb-8 -mt-6 relative z-10 space-y-5">
        {/* Title card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h1 className="font-unbounded text-xl font-bold">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ChefHat className="w-3.5 h-3.5" /> {event.chef_name}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.duration_minutes} min</span>
              <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-primary" /> +{event.energy_reward} pts</span>
            </div>
            {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}

            {!isLiveOrPast && countdown && (
              <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Empieza en</p>
                <p className="font-unbounded text-2xl font-bold text-primary">{countdown}</p>
              </div>
            )}

            {participation ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="w-4 h-4" /> Estás inscrito
                </div>
                {(event.status === 'live' || event.status === 'published') && (
                  <Button onClick={handleEnterLive} className="w-full gap-2" size="lg">
                    🔥 Entrar al directo
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={handleJoin} disabled={joining} className="w-full gap-2" size="lg">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                Unirme al reto
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-unbounded text-sm font-bold">📅 Fecha y hora</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(event.scheduled_at), "EEEE d 'de' MMMM yyyy · HH:mm'h'", { locale: es })}
            </p>
          </CardContent>
        </Card>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-unbounded text-sm font-bold">🛒 Ingredientes</h3>
              <ul className="space-y-1">
                {ingredients.map((ing: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> {ing}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Utensils */}
        {utensils.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-unbounded text-sm font-bold">🍳 Utensilios</h3>
              <ul className="space-y-1">
                {utensils.map((u: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> {u}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Steps preview */}
        {steps.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-unbounded text-sm font-bold">📋 {steps.length} pasos</h3>
              {steps.map(step => (
                <div key={step.id} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step.step_number}
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(step.duration_seconds / 60)} min</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Rules */}
        {event.rules && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-unbounded text-sm font-bold">📏 Normas</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{event.rules}</p>
            </CardContent>
          </Card>
        )}

        {/* Evaluation criteria */}
        {event.evaluation_criteria && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-unbounded text-sm font-bold">⭐ Criterios de evaluación</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{event.evaluation_criteria}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileAppLayout>
  );
};

export default AppChefLobby;
