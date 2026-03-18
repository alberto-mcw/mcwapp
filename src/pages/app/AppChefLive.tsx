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

const AppChefLive = () => {
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
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (id && user) loadData();
    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [id, user]);

  useEffect(() => {
    if (event) {
      globalTimerRef.current = setInterval(() => setGlobalTimer(prev => prev + 1), 1000);
    }
  }, [event]);

  useEffect(() => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      setStepTimers(prev => ({
        ...prev,
        [currentStepIndex]: (prev[currentStepIndex] || 0) + 1
      }));
    }, 1000);
    return () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current); };
  }, [currentStepIndex]);

  const loadData = async () => {
    const [{ data: ev }, { data: st }, { data: part }] = await Promise.all([
      supabase.from('chef_events').select('*').eq('id', id!).single(),
      supabase.from('chef_event_steps').select('*').eq('event_id', id!).order('step_number'),
      supabase.from('chef_event_participants').select('*').eq('event_id', id!).eq('user_id', user!.id).maybeSingle(),
    ]);
    setEvent(ev);
    setSteps(st || []);
    setParticipation(part);
    if (part) {
      const { data: subs } = await supabase
        .from('chef_step_submissions').select('*').eq('participant_id', part.id);
      setSubmissions(subs || []);
      setCurrentStepIndex(Math.min(part.current_step || 0, (st || []).length - 1));
    }
    setLoading(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => { setPhotoPreview(ev.target?.result as string); setPhotoDialogOpen(true); };
    reader.readAsDataURL(file);
  }, []);

  const handleUploadPhoto = async () => {
    if (!photoFile || !participation || !steps[currentStepIndex]) return;
    setUploading(true);
    const ext = photoFile.name.split('.').pop();
    const path = `${event.id}/${user!.id}/${steps[currentStepIndex].id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('chef-events').upload(path, photoFile, { upsert: true });
    if (uploadError) { toast({ title: 'Error al subir la foto', variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('chef-events').getPublicUrl(path);
    await supabase.from('chef_step_submissions').insert({
      participant_id: participation.id,
      step_id: steps[currentStepIndex].id,
      photo_url: urlData.publicUrl,
      time_taken_seconds: stepTimers[currentStepIndex] || 0,
    });
    setSubmissions(prev => [...prev, { step_id: steps[currentStepIndex].id, photo_url: urlData.publicUrl }]);
    toast({ title: '📸 ¡Foto subida!', description: 'Buen trabajo, sigue así' });
    setPhotoDialogOpen(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    setUploading(false);
  };

  const handleCompleteStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      await supabase.from('chef_event_participants').update({ current_step: nextIndex }).eq('id', participation.id);
      toast({ title: `✅ Paso ${currentStepIndex + 1} completado` });
    } else {
      await supabase.from('chef_event_participants').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('id', participation.id);
      navigate(`/app/sigue-al-chef/${id}/resultado`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const stepSubmitted = submissions.some(s => s.step_id === currentStep?.id);
  const progress = ((currentStepIndex + (stepSubmitted ? 1 : 0)) / steps.length) * 100;
  const stepTime = stepTimers[currentStepIndex] || 0;
  const isOverTime = currentStep && stepTime > currentStep.duration_seconds;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Extract Twitch channel for embed
  const twitchChannel = event?.twitch_url?.match(/twitch\.tv\/(\w+)/)?.[1] || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Twitch embed - sticky top */}
      <div className="sticky top-0 z-40 bg-black">
        {twitchChannel ? (
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}&muted=false`}
            className="w-full aspect-video"
            allowFullScreen
          />
        ) : (
          <div className="w-full aspect-video bg-muted flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Directo no disponible</p>
          </div>
        )}
      </div>

      {/* Back button + global timer overlay */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-3 py-2 bg-background/80 backdrop-blur-md border-b border-border">
        <button onClick={() => navigate(`/app/sigue-al-chef/${id}`)} className="p-1.5 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 text-xs">
          <Badge variant="outline" className="gap-1 font-mono">
            <Clock className="w-3 h-3" /> {formatTime(globalTimer)}
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/20 font-mono">
            Paso {currentStepIndex + 1}/{steps.length}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Main content */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-32">
        {/* Current step */}
        {currentStep && (
          <Card className={`border-primary/30 ${isOverTime ? 'ring-1 ring-destructive/30' : ''}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-unbounded font-bold text-lg">
                  Paso {currentStep.step_number}: {currentStep.title}
                </h2>
                {isOverTime && <AlertTriangle className="w-5 h-5 text-destructive" />}
              </div>
              {currentStep.description && (
                <p className="text-sm text-muted-foreground">{currentStep.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs">
                <span className={`font-mono ${isOverTime ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  ⏱️ {formatTime(stepTime)} / {formatTime(currentStep.duration_seconds)}
                </span>
                {currentStep.photo_required && !stepSubmitted && (
                  <Badge variant="outline" className="text-[10px]">📷 Foto obligatoria</Badge>
                )}
                {stepSubmitted && (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
                    <Check className="w-3 h-3 mr-1" /> Foto subida
                  </Badge>
                )}
              </div>
              {currentStep.tips && (
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground flex gap-2">
                  <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{currentStep.tips}</span>
                </div>
              )}
              {currentStep.reference_image_url && (
                <img src={currentStep.reference_image_url} alt="Referencia" className="w-full rounded-lg max-h-40 object-cover" />
              )}
            </CardContent>
          </Card>
        )}

        {/* Step list */}
        <div className="space-y-2">
          {steps.map((step, idx) => {
            const done = submissions.some(s => s.step_id === step.id);
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step.id} className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-colors ${isCurrent ? 'bg-primary/10 border border-primary/20' : done ? 'bg-muted/50 opacity-60' : 'bg-card border border-border'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-green-500/20 text-green-500' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : step.step_number}
                </div>
                <span className={`flex-1 ${isCurrent ? 'font-semibold' : ''}`}>{step.title}</span>
                {isCurrent && <ChevronRight className="w-4 h-4 text-primary" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-xl border-t border-border" style={{ paddingBottom: 'max(var(--sab), 16px)' }}>
        <div className="flex gap-3">
          {currentStep?.photo_required || !stepSubmitted ? (
            <Button variant="outline" className="flex-1 gap-2 h-12 text-base" onClick={() => setTipsDialogOpen(true)}>
              <Camera className="w-5 h-5" />
              Subir foto
            </Button>
          ) : null}
          <Button
            onClick={handleCompleteStep}
            disabled={currentStep?.photo_required && !stepSubmitted}
            className="flex-1 gap-2 h-12 text-base"
          >
            {isLastStep ? <><Trophy className="w-5 h-5" /> Finalizar</> : <><Check className="w-5 h-5" /> Completar paso</>}
          </Button>
        </div>
      </div>

      {/* Tips before photo */}
      <Dialog open={tipsDialogOpen} onOpenChange={setTipsDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">📸 Tips para tu foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>💡 Buena iluminación natural</p>
            <p>📐 Plano cenital o 45°</p>
            <p>🚫 Sin filtros</p>
            <p>✅ Que se vea bien el resultado</p>
          </div>
          <Button className="w-full gap-2" onClick={() => { setTipsDialogOpen(false); fileInputRef.current?.click(); }}>
            <Camera className="w-4 h-4" /> Tomar foto
          </Button>
        </DialogContent>
      </Dialog>

      {/* Photo preview */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          {photoPreview && <img src={photoPreview} className="w-full rounded-lg" alt="Preview" />}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setPhotoDialogOpen(false); setPhotoPreview(null); }}>Cancelar</Button>
            <Button className="flex-1 gap-2" onClick={handleUploadPhoto} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

export default AppChefLive;
