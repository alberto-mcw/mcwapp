import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { 
  Trophy, 
  Upload, 
  Loader2, 
  Check, 
  Clock,
  Zap,
  ChefHat,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Challenge {
  id: string;
  title: string;
  description: string;
  energy_reward: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface Submission {
  id: string;
  challenge_id: string;
  video_url: string;
  status: string;
  created_at: string;
  transcription_status?: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  submission: Submission | null;
  isActive: boolean;
  onSubmissionComplete: () => void;
}

const ChallengeCard = ({ challenge, submission, isActive, onSubmissionComplete }: ChallengeCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [expanded, setExpanded] = useState(isActive);

  // Calculate if submission was on time (if exists)
  const wasSubmittedOnTime = submission 
    ? new Date(submission.created_at).toISOString().split('T')[0] <= challenge.ends_at 
    : false;

  // For display: if user has submission, show reward based on when they submitted
  // If no submission yet, show reward based on if challenge is still active
  const effectiveReward = submission
    ? (wasSubmittedOnTime ? challenge.energy_reward : Math.floor(challenge.energy_reward / 2))
    : (isActive ? challenge.energy_reward : Math.floor(challenge.energy_reward / 2));
  
  const showHalfLabel = submission ? !wasSubmittedOnTime : !isActive;

  const validateVideoAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const width = video.videoWidth;
        const height = video.videoHeight;
        const aspectRatio = width / height;
        const targetRatio = 9 / 16;
        const tolerance = 0.1;
        
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

  // AI transcription disabled - videos are reviewed manually by admins

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!dishName.trim()) {
      toast({
        title: 'Nombre del plato requerido',
        description: 'Por favor escribe el nombre de tu plato antes de subir el vídeo',
        variant: 'destructive'
      });
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Formato no válido',
        description: 'Por favor sube un archivo de vídeo',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Archivo demasiado grande',
        description: 'El vídeo debe ser menor a 100MB',
        variant: 'destructive'
      });
      return;
    }

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

      const { error: uploadError } = await supabase.storage
        .from('challenge-videos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenge-videos')
        .getPublicUrl(fileName);

      const { data: newSubmission, error: submitError } = await supabase
        .from('challenge_submissions')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          video_url: publicUrl,
          dish_name: dishName.trim(),
          description: description || null,
          transcription_status: 'pending'
        })
        .select('id, video_url, status, created_at, transcription_status')
        .single();

      if (submitError) throw submitError;

      toast({
        title: '🎬 ¡Vídeo subido!',
        description: 'Pendiente de revisión por los administradores'
      });

      onSubmissionComplete();

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
    const end = new Date(challenge.ends_at);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const formatDateRange = () => {
    const start = new Date(challenge.starts_at);
    const end = new Date(challenge.ends_at);
    return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <div className={cn(
      "border rounded-2xl overflow-hidden transition-all",
      isActive 
        ? "bg-card border-primary/30" 
        : "bg-card/50 border-border"
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full p-4 flex items-center justify-between transition-colors",
          isActive 
            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20" 
            : "bg-muted/30 hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isActive 
              ? "bg-gradient-to-br from-purple-500 to-pink-500" 
              : "bg-muted"
          )}>
            {isActive ? (
              <Trophy className="w-5 h-5 text-white" />
            ) : (
              <History className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="text-left">
            <h3 className={cn(
              "font-unbounded font-bold text-sm",
              !isActive && "text-muted-foreground"
            )}>
              {challenge.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isActive ? (
                <>
                  <Clock className="w-3 h-3" />
                  <span>{getDaysRemaining()} días restantes</span>
                </>
              ) : (
                <span>{formatDateRange()}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1 font-bold text-sm",
            isActive ? "text-purple-400" : "text-muted-foreground"
          )}>
            <Zap className="w-4 h-4" />
            +{effectiveReward}
            {showHalfLabel && (
              <span className="text-xs font-normal ml-1">(mitad)</span>
            )}
          </div>
          {submission && (
            <div className={cn(
              "w-2 h-2 rounded-full",
              submission.status === 'approved' ? "bg-green-500" :
              submission.status === 'rejected' ? "bg-red-500" :
              "bg-yellow-500"
            )} />
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-6 border-t border-border">
          <p className="text-muted-foreground mb-6">{challenge.description}</p>

          {submission ? (
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
                      <span className="font-medium text-green-500">
                        ¡Aprobado! +{effectiveReward} energía
                      </span>
                    </>
                  ) : submission.status === 'rejected' ? (
                    <span className="font-medium text-red-500">No aprobado</span>
                  ) : (
                    <>
                      <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                      <span className="font-medium text-yellow-500">Pendiente de revisión</span>
                    </>
                  )}
                </div>
              </div>


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
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" />
                  Nombre del plato <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Ej: Paella valenciana, Tortilla española..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="bg-background"
                  maxLength={100}
                />
              </div>

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
                  disabled={uploading || !dishName.trim()}
                />
                <Button 
                  asChild 
                  className={cn(
                    "w-full gap-2",
                    !dishName.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  )}
                  disabled={uploading || !dishName.trim()}
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

              {!isActive && !submission && (
                <p className="text-xs text-center text-amber-500 bg-amber-500/10 p-2 rounded-lg">
                  ⚠️ Este desafío ya finalizó. Recibirás la mitad de puntos ({effectiveReward} energía)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const WeeklyChallenges = () => {
  const { user } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all weekly challenges (active ones that haven't ended yet OR past ones)
      const { data: allChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenge_type', 'weekly')
        .order('starts_at', { ascending: false });

      if (allChallenges) {
        const active: Challenge[] = [];
        const past: Challenge[] = [];

        allChallenges.forEach(challenge => {
          const isCurrentlyActive = challenge.is_active && 
            challenge.starts_at <= today && 
            challenge.ends_at >= today;
          
          if (isCurrentlyActive) {
            active.push(challenge);
          } else if (challenge.ends_at < today) {
            past.push(challenge);
          }
        });

        setActiveChallenges(active);
        setPastChallenges(past);

        // Fetch user submissions for all these challenges
        if (user) {
          const challengeIds = [...active, ...past].map(c => c.id);
          if (challengeIds.length > 0) {
            const { data: userSubmissions } = await supabase
              .from('challenge_submissions')
              .select('id, challenge_id, video_url, status, created_at, transcription_status')
              .eq('user_id', user.id)
              .in('challenge_id', challengeIds);

            if (userSubmissions) {
              setSubmissions(userSubmissions);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getSubmissionForChallenge = (challengeId: string) => {
    return submissions.find(s => s.challenge_id === challengeId) || null;
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

  if (activeChallenges.length === 0 && pastChallenges.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-unbounded font-bold text-lg mb-2">Sin desafíos disponibles</h3>
          <p className="text-muted-foreground">
            El próximo desafío semanal se anunciará pronto
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Desafío en vigor
          </h3>
          {activeChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              submission={getSubmissionForChallenge(challenge.id)}
              isActive={true}
              onSubmissionComplete={fetchData}
            />
          ))}
        </div>
      )}

      {/* Past Challenges */}
      {pastChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <History className="w-4 h-4" />
            Desafíos anteriores (mitad de puntos)
          </h3>
          {pastChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              submission={getSubmissionForChallenge(challenge.id)}
              isActive={false}
              onSubmissionComplete={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
};
