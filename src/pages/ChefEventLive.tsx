import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Check, Clock, ChevronRight, ArrowLeft, AlertTriangle, Lightbulb, Trophy } from 'lucide-react';

const ChefEventLive = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [participation, setParticipation] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimers, setStepTimers] = useState<Record<number, number>>({});
  const [globalTimer, setGlobalTimer] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [tipsDialogOpen, setTipsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const stepTimerRef = useRef<any>(null);

  useEffect(() => {
    if (id && user) loadData();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(stepTimerRef.current);
    };
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: ev }, { data: st }, { data: part }] = await Promise.all([
      supabase.from('chef_events').select('*').eq('id', id).single(),
      supabase.from('chef_event_steps').select('*').eq('event_id', id).order('step_number'),
      supabase.from('chef_event_participants').select('*').eq('event_id', id).eq('user_id', user!.id).maybeSingle(),
    ]);
    setEvent(ev);
    setSteps(st || []);
    setParticipation(part);

    if (part) {
      const { data: subs } = await supabase
        .from('chef_step_submissions')
        .select('*')
        .eq('participant_id', part.id);
      setSubmissions(subs || []);
      setCurrentStepIndex(part.current_step || 0);
    }
    setLoading(false);
    startGlobalTimer();
  };

  const startGlobalTimer = () => {
    timerRef.current = setInterval(() => {
      setGlobalTimer(prev => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    // Step-specific timer
    clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      setStepTimers(prev => ({
        ...prev,
        [currentStepIndex]: (prev[currentStepIndex] || 0) + 1,
      }));
    }, 1000);
    return () => clearInterval(stepTimerRef.current);
  }, [currentStepIndex]);

  const currentStep = steps[currentStepIndex];
  const stepSubmission = submissions.find(s => s.step_id === currentStep?.id);
  const progressPercent = steps.length > 0 ? ((currentStepIndex + (stepSubmission ? 1 : 0)) / steps.length) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setPhotoDialogOpen(true);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !participation || !currentStep) return;
    setUploading(true);
    
    const ext = photoFile.name.split('.').pop();
    const path = `participants/${participation.id}/step-${currentStep.step_number}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from('chef-events').upload(path, photoFile, { upsert: true });
    if (uploadError) {
      toast({ title: 'Error al subir la foto', variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('chef-events').getPublicUrl(path);
    
    const timeTaken = stepTimers[currentStepIndex] || 0;
    const { data: sub, error: subError } = await supabase
      .from('chef_step_submissions')
      .insert({
        participant_id: participation.id,
        step_id: currentStep.id,
        photo_url: publicUrl,
        time_taken_seconds: timeTaken,
        status: 'submitted',
      })
      .select()
      .single();

    if (!subError && sub) {
      setSubmissions(prev => [...prev, sub]);
      toast({ title: '📸 ¡Foto subida!', description: 'Buen trabajo, sigue así' });
    }

    setPhotoDialogOpen(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    setUploading(false);
  };

  const handleCompleteStep = async () => {
    if (!participation) return;
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex >= steps.length) {
      // Finished all steps
      await supabase
        .from('chef_event_participants')
        .update({ current_step: nextIndex, status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', participation.id);
      navigate(`/sigue-al-chef/${id}/resultado`);
      return;
    }

    await supabase
      .from('chef_event_participants')
      .update({ current_step: nextIndex })
      .eq('id', participation.id);
    setCurrentStepIndex(nextIndex);
  };

  const canCompleteStep = !currentStep?.photo_required || stepSubmission;

  // Extract Twitch channel from URL
  const getTwitchChannel = (url: string) => {
    try {
      const u = new URL(url);
      return u.pathname.replace('/', '');
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event || !participation) {
    navigate(`/sigue-al-chef/${id}`);
    return null;
  }

  const twitchChannel = getTwitchChannel(event.twitch_url);
  const allDone = currentStepIndex >= steps.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Twitch Embed - Sticky top */}
      <div className="sticky top-0 z-40 bg-black">
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}&muted=false`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
          />
        </div>
        {/* Overlay bar */}
        <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="p-1" onClick={() => navigate(`/sigue-al-chef/${id}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Badge className="bg-red-500 text-white border-0 text-xs">🔴 LIVE</Badge>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm font-mono">
            <Clock className="w-4 h-4 text-primary" />
            {formatTime(globalTimer)}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Paso {Math.min(currentStepIndex + 1, steps.length)} de {steps.length}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-32">
        {allDone ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center space-y-4">
              <Trophy className="w-12 h-12 text-primary mx-auto" />
              <h2 className="font-unbounded text-xl font-bold">¡Has completado todos los pasos!</h2>
              <p className="text-muted-foreground">Vamos a ver tu resultado</p>
              <Button size="lg" className="gap-2" onClick={() => navigate(`/sigue-al-chef/${id}/resultado`)}>
                Ver mi resultado <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ) : currentStep && (
          <>
            {/* Current Step */}
            <Card className="border-primary/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-unbounded gap-1">
                    Paso {currentStep.step_number}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(stepTimers[currentStepIndex] || 0)}
                    <span className="text-xs">/ {formatTime(currentStep.duration_seconds)}</span>
                  </div>
                </div>

                <h3 className="font-unbounded text-lg font-bold">{currentStep.title}</h3>
                
                {currentStep.description && (
                  <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                )}

                {/* Time warning */}
                {(stepTimers[currentStepIndex] || 0) > currentStep.duration_seconds && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4" />
                    ¡Te estás pasando del tiempo recomendado!
                  </div>
                )}

                {/* Reference image */}
                {currentStep.reference_image_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Referencia:</p>
                    <img src={currentStep.reference_image_url} alt="" className="rounded-xl w-full max-h-48 object-cover" />
                  </div>
                )}

                {/* Photo requirement */}
                {currentStep.photo_required && !stepSubmission && (
                  <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">
                    <Camera className="w-4 h-4" />
                    📸 Este paso requiere foto obligatoria
                  </div>
                )}

                {stepSubmission && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-lg px-3 py-2">
                    <Check className="w-4 h-4" />
                    Foto subida ✓
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Steps mini-timeline */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {steps.map((step, i) => {
                const done = submissions.some(s => s.step_id === step.id);
                const active = i === currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      done
                        ? 'bg-primary text-primary-foreground border-primary'
                        : active
                        ? 'bg-primary/10 text-primary border-primary'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                );
              })}
            </div>

            {/* Tips */}
            {currentStep.tips && (
              <button
                onClick={() => setTipsDialogOpen(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lightbulb className="w-4 h-4 text-yellow-500" /> Ver consejo para este paso
              </button>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom actions */}
      {!allDone && currentStep && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-30" style={{ paddingBottom: 'max(var(--sab), 16px)' }}>
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!stepSubmission}
            >
              <Camera className="w-5 h-5" />
              {stepSubmission ? 'Foto subida ✓' : 'Subir foto'}
            </Button>
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleCompleteStep}
              disabled={!canCompleteStep}
            >
              {currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente paso'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoCapture}
      />

      {/* Photo preview dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-unbounded">Confirmar foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-3 text-sm space-y-1">
              <p className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> <strong>Tips para buena foto:</strong></p>
              <ul className="text-muted-foreground text-xs space-y-0.5 pl-6 list-disc">
                <li>Buena iluminación</li>
                <li>Plano claro y centrado</li>
                <li>Sin filtros</li>
                <li>Que se vea bien el resultado</li>
              </ul>
            </div>
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="w-full rounded-xl" />
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setPhotoDialogOpen(false); setPhotoPreview(null); }}>
                Repetir
              </Button>
              <Button className="flex-1 gap-2" onClick={handleUploadPhoto} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tips dialog */}
      <Dialog open={tipsDialogOpen} onOpenChange={setTipsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-unbounded flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" /> Consejo
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{currentStep?.tips}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChefEventLive;
