import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { 
  Trophy, 
  Upload, 
  Loader2, 
  Check, 
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  History,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Heart
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
  reel_url: string | null;
  status: string;
  created_at: string;
  views_count: number | null;
  likes_from_metrics: number | null;
  metrics_energy_earned: number | null;
  metrics_screenshot_url: string | null;
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
  const [analyzing, setAnalyzing] = useState(false);
  const [reelUrl, setReelUrl] = useState('');
  const [metricsPreview, setMetricsPreview] = useState<string | null>(null);
  const [analyzedMetrics, setAnalyzedMetrics] = useState<{
    views: number;
    likes: number;
    totalEnergy: number;
  } | null>(null);
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

  const validateReelUrl = (url: string): boolean => {
    const instagramPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(reel|p)\/[\w-]+/i;
    const tiktokPattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/@?[\w.-]+\/(video\/\d+|[\w-]+)/i;
    return instagramPattern.test(url) || tiktokPattern.test(url);
  };

  const handleMetricsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato no válido',
        description: 'Por favor sube una imagen (captura de pantalla)',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Archivo demasiado grande',
        description: 'La imagen debe ser menor a 10MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${challenge.id}/metrics.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('challenge-videos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenge-videos')
        .getPublicUrl(fileName);

      setMetricsPreview(publicUrl);
      
      // Analyze the screenshot with AI
      setAnalyzing(true);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ imageUrl: publicUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error analyzing metrics');
      }

      const metrics = await response.json();
      setAnalyzedMetrics({
        views: metrics.views,
        likes: metrics.likes,
        totalEnergy: metrics.totalEnergy
      });

      toast({
        title: '📊 ¡Métricas analizadas!',
        description: `${metrics.views.toLocaleString()} views, ${metrics.likes.toLocaleString()} likes = +${metrics.totalEnergy} puntos`
      });

    } catch (error) {
      console.error('Upload/analyze error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo analizar la captura',
        variant: 'destructive'
      });
      setMetricsPreview(null);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !reelUrl || !metricsPreview || !analyzedMetrics) return;

    if (!validateReelUrl(reelUrl)) {
      toast({
        title: 'Enlace no válido',
        description: 'Por favor introduce un enlace válido de Instagram Reel o TikTok',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const { error: submitError } = await supabase
        .from('challenge_submissions')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          video_url: reelUrl,
          reel_url: reelUrl,
          metrics_screenshot_url: metricsPreview,
          views_count: analyzedMetrics.views,
          likes_from_metrics: analyzedMetrics.likes,
          metrics_energy_earned: analyzedMetrics.totalEnergy,
          status: 'pending'
        });

      if (submitError) throw submitError;

      toast({
        title: '🎬 ¡Reel enviado!',
        description: 'Pendiente de revisión por los administradores'
      });

      onSubmissionComplete();
      setReelUrl('');
      setMetricsPreview(null);
      setAnalyzedMetrics(null);

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar. Inténtalo de nuevo.',
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
              <div className={cn(
                "p-4 rounded-xl border",
                submission.status === 'approved' 
                  ? 'border-accent bg-accent/10' 
                  : submission.status === 'rejected'
                  ? 'border-destructive/50 bg-destructive/10'
                  : 'border-primary/50 bg-primary/10'
              )}>
                <div className="flex items-center gap-2">
                  {submission.status === 'approved' ? (
                    <>
                      <Check className="w-5 h-5 text-accent-foreground" />
                      <span className="font-medium text-accent-foreground">
                        ¡Aprobado! +{effectiveReward} puntos
                      </span>
                    </>
                  ) : submission.status === 'rejected' ? (
                    <span className="font-medium text-destructive">No aprobado</span>
                  ) : (
                    <>
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="font-medium text-primary">Pendiente de revisión</span>
                    </>
                  )}
                </div>
              </div>

              {/* Show submitted info */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  <a 
                    href={submission.reel_url || submission.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {submission.reel_url || submission.video_url}
                  </a>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Eye className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-lg">{submission.views_count?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Heart className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-lg">{submission.likes_from_metrics?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">likes</p>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Zap className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-lg text-primary">+{submission.metrics_energy_earned || 0}</p>
                    <p className="text-xs text-muted-foreground">puntos</p>
                  </div>
                </div>

                {submission.metrics_screenshot_url && (
                  <div className="mt-3">
                    <img 
                      src={submission.metrics_screenshot_url} 
                      alt="Captura de métricas" 
                      className="w-full max-h-48 object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reel URL input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  Enlace al reel <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="https://instagram.com/reel/... o https://tiktok.com/..."
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Pega el enlace de tu Reel de Instagram o vídeo de TikTok
                </p>
              </div>

              {/* Metrics screenshot upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Captura de métricas <span className="text-destructive">*</span>
                </label>
                
                {metricsPreview ? (
                  <div className="relative">
                    <img 
                      src={metricsPreview} 
                      alt="Captura de métricas" 
                      className="w-full max-h-48 object-contain rounded-lg border border-border"
                    />
                    {analyzing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-sm">Analizando métricas...</p>
                        </div>
                      </div>
                    )}
                    {analyzedMetrics && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted rounded-lg p-2">
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            Views
                          </div>
                          <p className="font-bold">{analyzedMetrics.views.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted rounded-lg p-2">
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Heart className="w-3 h-3" />
                            Likes
                          </div>
                          <p className="font-bold">{analyzedMetrics.likes.toLocaleString()}</p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-1 text-xs text-primary">
                            <Zap className="w-3 h-3" />
                            Energía
                          </div>
                          <p className="font-bold text-primary">+{analyzedMetrics.totalEnergy}</p>
                        </div>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => {
                        setMetricsPreview(null);
                        setAnalyzedMetrics(null);
                      }}
                    >
                      Cambiar captura
                    </Button>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMetricsUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Sube una captura de las métricas de tu reel
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            (donde se vean views y likes)
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>

              {/* Submit button */}
              <Button 
                className="w-full gap-2"
                disabled={uploading || !reelUrl || !metricsPreview || !analyzedMetrics}
                onClick={handleSubmit}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar mi reel
                  </>
                )}
              </Button>

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
              .select('id, challenge_id, video_url, reel_url, status, created_at, views_count, likes_from_metrics, metrics_energy_earned, metrics_screenshot_url')
              .eq('user_id', user.id)
              .in('challenge_id', challengeIds);

            if (userSubmissions) {
              setSubmissions(userSubmissions as Submission[]);
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
