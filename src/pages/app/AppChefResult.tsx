import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { SecondaryHeader } from '@/components/app/SecondaryHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Trophy, Clock, Eye, Star, CheckCircle2, Share2 } from 'lucide-react';

const AppChefResult = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [participation, setParticipation] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) loadData();
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: ev }, { data: st }, { data: part }] = await Promise.all([
      supabase.from('chef_events').select('*').eq('id', id!).single(),
      supabase.from('chef_event_steps').select('*').eq('event_id', id!).order('step_number'),
      supabase.from('chef_event_participants').select('*').eq('event_id', id!).eq('user_id', user!.id).maybeSingle(),
    ]);
    setEvent(ev);
    setSteps(st || []);
    setParticipation(part);
    if (part) {
      const [{ data: subs }, { data: sc }] = await Promise.all([
        supabase.from('chef_step_submissions').select('*').eq('participant_id', part.id),
        supabase.from('chef_event_scores').select('*').eq('participant_id', part.id).maybeSingle(),
      ]);
      setSubmissions(subs || []);
      setScore(sc);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <MobileAppLayout showNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileAppLayout>
    );
  }

  const scoreItems = score ? [
    { label: 'Fidelidad visual', value: score.visual_fidelity, icon: <Eye className="w-4 h-4" /> },
    { label: 'Tiempo', value: score.timing, icon: <Clock className="w-4 h-4" /> },
    { label: 'Presentación', value: score.presentation, icon: <Star className="w-4 h-4" /> },
    { label: 'Completitud', value: score.completeness, icon: <CheckCircle2 className="w-4 h-4" /> },
  ] : [];

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Mi resultado en ${event?.title}`,
        text: `He conseguido ${score?.total_score || 0} puntos en Sigue al Chef! 🔥`,
        url: window.location.href,
      });
    }
  };

  return (
    <MobileAppLayout showNav={false}>
      <SecondaryHeader title="Resultado" onBack={() => navigate('/app/sigue-al-chef')} />
      
      <div className="px-4 pt-4 pb-8 space-y-5">

        {/* Score hero */}
        <div className="text-center space-y-3 py-6">
          <Trophy className="w-16 h-16 text-primary mx-auto" />
          <h1 className="font-unbounded text-2xl font-bold">
            {score ? `${score.total_score} puntos` : 'Pendiente de evaluación'}
          </h1>
          {score?.badge && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-4">
              🏆 {score.badge}
            </Badge>
          )}
          <p className="text-sm text-muted-foreground">{event?.title}</p>
        </div>

        {/* Breakdown */}
        {score && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-unbounded text-sm font-bold">Desglose</h3>
              {scoreItems.map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {item.icon} {item.label}
                    </span>
                    <span className="font-bold">{item.value}/25</span>
                  </div>
                  <Progress value={(item.value / 25) * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Gallery */}
        {submissions.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-unbounded text-sm font-bold">Tu galería</h3>
              <div className="grid grid-cols-2 gap-2">
                {submissions.filter(s => s.photo_url).map((sub, i) => (
                  <img key={i} src={sub.photo_url} alt={`Paso ${i + 1}`} className="rounded-lg w-full aspect-square object-cover" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {steps.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-unbounded text-sm font-bold">Timeline</h3>
              {steps.map(step => {
                const sub = submissions.find(s => s.step_id === step.id);
                return (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${sub ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                      {sub ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.step_number}
                    </div>
                    <span className="flex-1">{step.title}</span>
                    {sub?.time_taken_seconds && (
                      <span className="text-xs text-muted-foreground">{Math.round(sub.time_taken_seconds / 60)}m</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Share */}
        <Button onClick={handleShare} variant="outline" className="w-full gap-2">
          <Share2 className="w-4 h-4" /> Compartir resultado
        </Button>
      </div>
    </MobileAppLayout>
  );
};

export default AppChefResult;
