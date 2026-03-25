import { useState, useEffect, useMemo } from 'react';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { SectionTitle } from '@/components/app/SectionTitle';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  Loader2,
  Heart,
  Share2,
  X,
  ChefHat,
  UtensilsCrossed,
  ListOrdered,
  Star,
  ChevronDown
} from 'lucide-react';

interface RecipeData {
  ingredients?: string[];
  steps?: string[];
  utensils?: string[];
}

interface Submission {
  id: string;
  video_url: string;
  description: string | null;
  dish_name: string | null;
  created_at: string;
  challenge_id: string;
  user_id: string;
  likes_count: number;
  recipe_data: unknown;
  challenges: {
    title: string;
  } | null;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface SubmissionWithProfile extends Submission {
  profile?: Profile | null;
  hasLiked?: boolean;
  hasSuperLike?: boolean;
}

const EMOJI_AVATARS = ['🍕', '🍷', '🥐', '🍣', '☕', '🍞', '🍾', '🍜', '🦪', '🍰', '🔪', '🍏', '🌯', '🍫', '🍔', '🧋', '🍝', '🍦', '🥘', '🍪'];

const isEmojiAvatar = (avatarUrl: string | null | undefined): boolean => {
  return !!avatarUrl && EMOJI_AVATARS.includes(avatarUrl);
};

const renderAvatar = (avatarUrl: string | null | undefined, size: 'sm' | 'md' = 'sm') => {
  const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const emojiSize = size === 'sm' ? 'text-sm' : 'text-lg';
  
  if (isEmojiAvatar(avatarUrl)) {
    return (
      <div className={`${sizeClasses} rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
        <span className={emojiSize}>{avatarUrl}</span>
      </div>
    );
  }
  
  if (avatarUrl && avatarUrl.startsWith('http')) {
    return (
      <div className={`${sizeClasses} rounded-full overflow-hidden bg-muted flex-shrink-0`}>
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  
  return (
    <div className={`${sizeClasses} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0`}>
      <ChefHat className={`${iconSize} text-primary`} />
    </div>
  );
};

const AppGallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<SubmissionWithProfile | null>(null);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [recipeModal, setRecipeModal] = useState<SubmissionWithProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const getRecipeData = (data: unknown): RecipeData | null => {
    if (!data || typeof data !== 'object') return null;
    const recipe = data as RecipeData;
    if (recipe.ingredients || recipe.steps || recipe.utensils) {
      return recipe;
    }
    return null;
  };

  // Group submissions by challenge
  const { challengeTabs, submissionsByChallenge } = useMemo(() => {
    const grouped: Record<string, SubmissionWithProfile[]> = {};
    const tabs: { id: string; title: string; count: number }[] = [];
    
    submissions.forEach(sub => {
      const key = sub.challenge_id;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(sub);
    });
    
    Object.keys(grouped).forEach(key => {
      grouped[key] = grouped[key].sort((a, b) => b.likes_count - a.likes_count);
      const firstSub = grouped[key][0];
      if (firstSub?.challenges?.title) {
        tabs.push({
          id: key,
          title: firstSub.challenges.title,
          count: grouped[key].length
        });
      }
    });
    
    grouped['all'] = [...submissions].sort((a, b) => b.likes_count - a.likes_count);
    
    return { challengeTabs: tabs, submissionsByChallenge: grouped };
  }, [submissions]);

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('challenge_submissions')
        .select(`
          id,
          video_url,
          description,
          dish_name,
          created_at,
          challenge_id,
          user_id,
          likes_count,
          recipe_data,
          challenges (
            title
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      
      if (!submissionsData || submissionsData.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(submissionsData.map(s => s.user_id))];

      const { data: profiles } = await supabase
        .rpc('get_public_profiles', { p_user_ids: userIds });

      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('video_likes')
          .select('submission_id')
          .eq('user_id', user.id);
        
        userLikes = likesData?.map(l => l.submission_id) || [];
      }

      const submissionIds = submissionsData.map(s => s.id);
      const { data: superLikesData } = await supabase
        .from('super_likes')
        .select('submission_id')
        .in('submission_id', submissionIds);
      
      const superLikedIds = superLikesData?.map(sl => sl.submission_id) || [];

      const submissionsWithProfiles = submissionsData.map(submission => ({
        ...submission,
        profile: profiles?.find(p => p.user_id === submission.user_id) || null,
        hasLiked: userLikes.includes(submission.id),
        hasSuperLike: superLikedIds.includes(submission.id)
      }));

      setSubmissions(submissionsWithProfiles);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (submissionId: string) => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Necesitas iniciar sesión para dar likes',
        variant: 'destructive'
      });
      return;
    }

    const submission = submissions.find(s => s.id === submissionId);
    if (submission?.user_id === user.id) {
      toast({
        title: 'No puedes',
        description: 'No puedes darte like a ti mismo',
        variant: 'destructive'
      });
      return;
    }

    setLikingIds(prev => new Set(prev).add(submissionId));

    try {
      const hasLiked = submissions.find(s => s.id === submissionId)?.hasLiked;

      if (hasLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('submission_id', submissionId);

        await supabase
          .from('challenge_submissions')
          .update({ likes_count: (submission?.likes_count || 1) - 1 })
          .eq('id', submissionId);
      } else {
        await supabase
          .from('video_likes')
          .insert({ user_id: user.id, submission_id: submissionId });

        await supabase
          .from('challenge_submissions')
          .update({ likes_count: (submission?.likes_count || 0) + 1 })
          .eq('id', submissionId);
      }

      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { 
              ...s, 
              hasLiked: !hasLiked,
              likes_count: hasLiked ? s.likes_count - 1 : s.likes_count + 1
            }
          : s
      ));
    } catch (error) {
      console.error('Error liking:', error);
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  };

  const handleShare = async (submissionId: string) => {
    const url = `${window.location.origin}/videos?v=${submissionId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MCW El Reto',
          text: 'Mira este vídeo en MCW El Reto',
          url
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Enlace copiado',
        description: 'El enlace se ha copiado al portapapeles'
      });
    }
  };

  if (loading) {
    return (
      <MobileAppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileAppLayout>
    );
  }

  const currentVideos = submissionsByChallenge[activeTab] || [];

  return (
    <MobileAppLayout>
      {/* AppHeader + title/filter merged into one sticky glass block */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl">
        <AppHeader bare />
        <div className="px-4 pt-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="app-section-title text-left shrink-0">Galería</h1>
          <div className="relative min-w-0 max-w-[9rem]">
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
              className="appearance-none w-full bg-white/5 border border-white/15 text-white text-xs font-medium rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:border-white/30 cursor-pointer truncate"
            >
              <option value="all">Todos ({submissions.length})</option>
              {challengeTabs.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.title} ({tab.count})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none" />
          </div>
        </div>
      </div>
      </div>

      <div className="px-4 pt-3 pb-3">
          {/* Video Grid */}
          <div className="grid grid-cols-2 gap-3">
            {currentVideos.map((submission, index) => {
              const isOwnVideo = user?.id === submission.user_id;
              
              return (
                <div 
                  key={submission.id}
                  className={`bg-card border rounded-xl overflow-hidden relative ${
                    submission.hasSuperLike 
                      ? 'border-yellow-500/70 ring-1 ring-yellow-500/30' 
                      : 'border-border'
                  }`}
                >
                  {/* SuperLike badge */}
                  {submission.hasSuperLike && (
                    <div className="absolute top-1.5 right-1.5 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      TOP
                    </div>
                  )}
                  
                  {/* Ranking badge for top 3 */}
                  {index < 3 && (
                    <div className={`absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-primary-foreground ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-muted-foreground' : 'bg-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                  
                  <div className="relative aspect-[9/16] bg-black">
                    <video
                      src={submission.video_url}
                      className="w-full h-full object-contain"
                      onClick={() => setSelectedVideo(submission)}
                    />
                    <button
                      onClick={() => setSelectedVideo(submission)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      </div>
                    </button>
                    
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(submission.id);
                        }}
                        className="flex items-center justify-center w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full"
                      >
                        <Share2 className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(submission.id);
                        }}
                        disabled={likingIds.has(submission.id) || isOwnVideo}
                        className={`flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 ${
                          isOwnVideo ? 'opacity-50' : ''
                        }`}
                      >
                        <Heart 
                          className={`w-3.5 h-3.5 ${
                            submission.hasLiked 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-white'
                          }`} 
                        />
                        <span className="text-white text-xs font-medium">
                          {submission.likes_count}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 space-y-1.5">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                      {submission.dish_name || 'Nombre por determinar'}
                    </p>

                    <div className="flex items-center gap-1.5">
                      {renderAvatar(submission.profile?.avatar_url, 'sm')}
                      <span className="text-[10px] text-muted-foreground truncate">
                        {submission.profile?.display_name || 'Chef Anónimo'}
                      </span>
                    </div>

                    {getRecipeData(submission.recipe_data) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecipeModal(submission);
                        }}
                        className="w-full gap-1.5 text-[10px] h-7 border-primary/50 text-primary"
                      >
                        <ChefHat className="w-3 h-3" />
                        Ver receta
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {currentVideos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay vídeos en esta categoría
            </div>
          )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex-1 flex items-center justify-center">
            <video
              src={selectedVideo.video_url}
              controls
              autoPlay
              className="max-h-full max-w-full"
            />
          </div>
          
          <div className="bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              {renderAvatar(selectedVideo.profile?.avatar_url, 'md')}
              <div>
                <p className="font-bold text-sm">{selectedVideo.dish_name || 'Plato sin nombre'}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedVideo.profile?.display_name || 'Chef Anónimo'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleLike(selectedVideo.id)}
                disabled={likingIds.has(selectedVideo.id) || user?.id === selectedVideo.user_id}
                className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2"
              >
                <Heart 
                  className={`w-5 h-5 ${
                    selectedVideo.hasLiked 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-foreground'
                  }`} 
                />
                <span className="font-medium">{selectedVideo.likes_count}</span>
              </button>
              
              <button
                onClick={() => handleShare(selectedVideo.id)}
                className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2"
              >
                <Share2 className="w-5 h-5" />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      <Dialog open={!!recipeModal} onOpenChange={() => setRecipeModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              {recipeModal?.dish_name || 'Receta'}
            </DialogTitle>
          </DialogHeader>
          
          {recipeModal && getRecipeData(recipeModal.recipe_data) && (
            <div className="space-y-4">
              {getRecipeData(recipeModal.recipe_data)?.ingredients && (
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                    Ingredientes
                  </h4>
                  <ul className="text-sm space-y-1">
                    {getRecipeData(recipeModal.recipe_data)?.ingredients?.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {getRecipeData(recipeModal.recipe_data)?.steps && (
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
                    <ListOrdered className="w-4 h-4 text-primary" />
                    Pasos
                  </h4>
                  <ol className="text-sm space-y-2">
                    {getRecipeData(recipeModal.recipe_data)?.steps?.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-bold text-primary">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MobileAppLayout>
  );
};

export default AppGallery;
