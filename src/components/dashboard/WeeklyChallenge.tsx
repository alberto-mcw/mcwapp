import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Upload, 
  Video, 
  Loader2, 
  Check, 
  Calendar,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  energy_reward: number;
  starts_at: string;
  ends_at: string;
}

interface Submission {
  id: string;
  video_url: string;
  status: string;
  created_at: string;
  transcription_status?: string;
}

export const WeeklyChallenge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [processingAI, setProcessingAI] = useState(false);

  useEffect(() => {
    fetchChallengeAndSubmission();
  }, [user]);

  const fetchChallengeAndSubmission = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch active weekly challenge
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenge_type', 'weekly')
        .eq('is_active', true)
        .lte('starts_at', today)
        .gte('ends_at', today)
        .limit(1);

      if (challenges && challenges.length > 0) {
        setChallenge(challenges[0]);

        // Check if user has submitted
        if (user) {
          const { data: submissions } = await supabase
            .from('challenge_submissions')
            .select('id, video_url, status, created_at, transcription_status')
            .eq('user_id', user.id)
            .eq('challenge_id', challenges[0].id)
            .limit(1);

          if (submissions && submissions.length > 0) {
            setSubmission(submissions[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateVideoAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const width = video.videoWidth;
        const height = video.videoHeight;
        const aspectRatio = width / height;
        const targetRatio = 9 / 16; // 0.5625
        const tolerance = 0.1; // 10% tolerance
        
        const isValid = Math.abs(aspectRatio - targetRatio) <= tolerance;
        resolve(isValid);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const processVideoWithAI = async (submissionId: string, videoUrl: string) => {
    setProcessingAI(true);
    try {
      // Step 1: Transcribe the video
      toast({
        title: '🎙️ Transcribiendo vídeo...',
        description: 'La IA está escuchando tu receta'
      });

      const transcribeResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ submissionId, videoUrl })
        }
      );

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.json();
        throw new Error(error.error || 'Error en la transcripción');
      }

      // Step 2: Extract recipe from transcription
      toast({
        title: '🍳 Extrayendo receta...',
        description: 'La IA está organizando los ingredientes y pasos'
      });

      const extractResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-recipe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ submissionId })
        }
      );

      if (!extractResponse.ok) {
        const error = await extractResponse.json();
        throw new Error(error.error || 'Error al extraer la receta');
      }

      toast({
        title: '✨ ¡Receta extraída!',
        description: 'Tu receta está lista para ser vista'
      });

      // Refresh submission to get updated status
      fetchChallengeAndSubmission();

    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: 'Error de IA',
        description: error instanceof Error ? error.message : 'No se pudo procesar el vídeo',
        variant: 'destructive'
      });
    } finally {
      setProcessingAI(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !challenge) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Formato no válido',
        description: 'Por favor sube un archivo de vídeo',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: 'Archivo demasiado grande',
        description: 'El vídeo debe ser menor a 100MB',
        variant: 'destructive'
      });
      return;
    }

    // Validate aspect ratio (9:16)
    const isValidAspect = await validateVideoAspectRatio(file);
    if (!isValidAspect) {
      toast({
        title: 'Formato de vídeo incorrecto',
        description: 'El vídeo debe estar en formato vertical 9:16 (como TikTok o Reels)',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${challenge.id}/video.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('challenge-videos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('challenge-videos')
        .getPublicUrl(fileName);

      // Create submission
      const { data: newSubmission, error: submitError } = await supabase
        .from('challenge_submissions')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          video_url: publicUrl,
          description: description || null,
          transcription_status: 'pending'
        })
        .select('id, video_url, status, created_at, transcription_status')
        .single();

      if (submitError) throw submitError;

      toast({
        title: '🎬 ¡Vídeo subido!',
        description: 'Procesando con IA...'
      });

      setSubmission(newSubmission);

      // Process with AI (transcribe + extract recipe)
      await processVideoWithAI(newSubmission.id, publicUrl);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el vídeo. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const getDaysRemaining = () => {
    if (!challenge) return 0;
    const end = new Date(challenge.ends_at);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-unbounded font-bold text-lg mb-2">Sin desafío activo</h3>
          <p className="text-muted-foreground">
            El próximo desafío semanal se anunciará pronto
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-unbounded font-bold">Desafío Semanal</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{getDaysRemaining()} días restantes</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-purple-400 font-bold">
            <Zap className="w-4 h-4" />
            +{challenge.energy_reward}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h4 className="font-unbounded font-bold text-lg mb-2">{challenge.title}</h4>
        <p className="text-muted-foreground mb-6">{challenge.description}</p>

        {submission ? (
          // Already submitted
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              submission.status === 'approved' 
                ? 'border-green-500/50 bg-green-500/10' 
                : submission.status === 'rejected'
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-yellow-500/50 bg-yellow-500/10'
            }`}>
              <div className="flex items-center gap-2">
                {submission.status === 'approved' ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-500">¡Aprobado! +{challenge.energy_reward} energía</span>
                  </>
                ) : submission.status === 'rejected' ? (
                  <>
                    <span className="font-medium text-red-500">No aprobado</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                    <span className="font-medium text-yellow-500">Pendiente de revisión</span>
                  </>
                )}
              </div>
            </div>

            {/* AI Processing Status */}
            {(processingAI || submission.transcription_status === 'processing' || submission.transcription_status === 'transcribed') && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-400">
                  {submission.transcription_status === 'transcribed' 
                    ? 'Extrayendo receta...' 
                    : 'Transcribiendo vídeo...'}
                </span>
              </div>
            )}

            {submission.transcription_status === 'complete' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">¡Receta extraída! Ver en galería</span>
              </div>
            )}

            {/* Show submitted video in 9:16 aspect ratio */}
            <div className="flex justify-center">
              <div className="w-full max-w-[200px] aspect-[9/16] rounded-xl overflow-hidden bg-black">
                <video 
                  src={submission.video_url} 
                  controls 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          // Upload form
          <div className="space-y-4">
            <Textarea
              placeholder="Describe tu creación (opcional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background resize-none"
              rows={2}
            />

            <label className="block">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button 
                asChild 
                className="w-full gap-2 cursor-pointer"
                disabled={uploading}
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subiendo vídeo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Subir mi vídeo
                    </>
                  )}
                </span>
              </Button>
            </label>

            <p className="text-xs text-muted-foreground text-center">
              📱 Formato vertical 9:16 (como TikTok/Reels) · Máximo 100MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
