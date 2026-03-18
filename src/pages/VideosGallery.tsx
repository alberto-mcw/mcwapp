import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuperLikeButton } from '@/components/gallery/SuperLikeButton';
import { 
  Play, 
  Loader2, 
  Trophy, 
  ArrowRight,
  Heart,
  Zap,
  Share2,
  Copy,
  X,
  ChefHat,
  UtensilsCrossed,
  ListOrdered,
  Star,
  ArrowUpDown,
  CalendarDays,
  TrendingUp,
  Plus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminVideoUpload } from '@/components/admin/AdminVideoUpload';

interface RecipeData {
  ingredients?: string[];
  steps?: string[];
  utensils?: string[];
}

type JsonRecipeData = RecipeData | null;

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
  transcription_status: string | null;
  challenges: {
    title: string;
    ends_at: string;
  } | null;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
}

interface SubmissionWithProfile extends Submission {
  profile?: Profile | null;
  hasLiked?: boolean;
  hasSuperLike?: boolean;
}

// Emoji avatars list - same as in ProfileCard
const EMOJI_AVATARS = ['🍕', '🍷', '🥐', '🍣', '☕', '🍞', '🍾', '🍜', '🦪', '🍰', '🔪', '🍏', '🌯', '🍫', '🍔', '🧋', '🍝', '🍦', '🥘', '🍪'];

// Helper to check if avatar is an emoji
const isEmojiAvatar = (avatarUrl: string | null | undefined): boolean => {
  return !!avatarUrl && EMOJI_AVATARS.includes(avatarUrl);
};

// Helper to render avatar properly
const renderAvatar = (avatarUrl: string | null | undefined, size: 'sm' | 'md' = 'sm') => {
  const sizeClasses = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const emojiSize = size === 'sm' ? 'text-lg' : 'text-2xl';
  
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
        <img 
          src={avatarUrl} 
          alt="" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, replace with ChefHat icon
            const parent = e.currentTarget.parentElement;
            if (parent) {
              e.currentTarget.style.display = 'none';
              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-primary/10"><svg class="${iconSize} text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/></svg></div>`;
            }
          }}
        />
      </div>
    );
  }
  
  // Default: ChefHat icon
  return (
    <div className={`${sizeClasses} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0`}>
      <ChefHat className={`${iconSize} text-primary`} />
    </div>
  );
};

// VideoGrid component for reuse in tabs
interface VideoGridProps {
  videos: SubmissionWithProfile[];
  user: { id: string } | null;
  isAdmin: boolean;
  likingIds: Set<string>;
  onVideoSelect: (video: SubmissionWithProfile) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  onShare: (id: string, e: React.MouseEvent) => void;
  onRecipeView: (video: SubmissionWithProfile) => void;
  onSuperLikeChange: (submissionId: string, hasSuperLike: boolean) => void;
  getRecipeData: (data: unknown) => RecipeData | null;
  showChallenge: boolean;
}

const VideoGrid = ({ 
  videos, 
  user,
  isAdmin,
  likingIds, 
  onVideoSelect, 
  onLike, 
  onShare, 
  onRecipeView,
  onSuperLikeChange,
  getRecipeData,
  showChallenge 
}: VideoGridProps) => {
  const { t } = useTranslation();

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('videosPage.noVideosCategory')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {videos.map((submission, index) => {
        const isOwnVideo = user?.id === submission.user_id;
        
        return (
          <div 
            key={submission.id}
            className={`bg-card border rounded-2xl overflow-hidden group transition-all relative ${
              submission.hasSuperLike 
                ? 'border-yellow-500/70 ring-2 ring-yellow-500/30' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            {/* SuperLike badge */}
            {submission.hasSuperLike && (
              <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                TOP
              </div>
            )}
            
            {/* Ranking badge for top 3 */}
            {index < 3 && (
              <div className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
              }`}>
                {index + 1}
              </div>
            )}
            
            <div className="relative aspect-[9/16] bg-black">
              {(() => {
                const url = submission.video_url;
                const igMatch = url.match(/instagram\.com\/(reel|p)\/([\w-]+)/);
                const ttMatch = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
                const ytMatch = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([\w-]+)/);
                
                if (igMatch) {
                  return <iframe src={`https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed`} className="w-full h-full" allowFullScreen />;
                }
                if (ttMatch) {
                  return <iframe src={`https://www.tiktok.com/embed/v2/${ttMatch[1]}`} className="w-full h-full" allowFullScreen />;
                }
                if (ytMatch) {
                  return <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="w-full h-full" allowFullScreen />;
                }
                return (
                  <>
                    <video
                      src={url}
                      className="w-full h-full object-contain"
                      onClick={() => onVideoSelect(submission)}
                    />
                    <button
                      onClick={() => onVideoSelect(submission)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary-foreground ml-1" />
                      </div>
                    </button>
                  </>
                );
              })()}
              
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  onClick={(e) => onShare(submission.id, e)}
                  className="flex items-center justify-center w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => onLike(submission.id, e)}
                  disabled={likingIds.has(submission.id) || isOwnVideo}
                  className={`flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 transition-colors ${
                    isOwnVideo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/80'
                  }`}
                  title={isOwnVideo ? t('videosPage.cantLikeSelf') : ''}
                >
                  <Heart 
                    className={`w-4 h-4 transition-colors ${
                      submission.hasLiked 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-white'
                    }`} 
                  />
                  <span className="text-white text-sm font-medium">
                    {submission.likes_count}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {/* 1. Challenge title - only show if showChallenge is true */}
              {showChallenge && submission.challenges?.title && (
                <p className="text-xs font-bold text-primary truncate">
                  🏆 {submission.challenges.title}
                </p>
              )}
              
              {/* 2. Dish name */}
              <p className="text-sm font-semibold text-foreground line-clamp-2">
                {submission.dish_name || t('videosPage.namePending')}
              </p>

              {/* 3. Chef avatar and name */}
              <div className="flex items-center gap-2">
                {renderAvatar(submission.profile?.avatar_url, 'sm')}
                <span className="text-xs text-muted-foreground truncate">
                  {submission.profile?.display_name || t('videosPage.anonymousChef')}
                </span>
              </div>

              {/* 4. Upload date - only show year if different from current */}
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const date = new Date(submission.created_at);
                  const currentYear = new Date().getFullYear();
                  const isCurrentYear = date.getFullYear() === currentYear;
                  return date.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    ...(isCurrentYear ? {} : { year: 'numeric' })
                  });
                })()}
              </p>

              {/* Ver Receta Button */}
              {getRecipeData(submission.recipe_data) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecipeView(submission);
                  }}
                  className="w-full gap-2 text-xs border-primary/50 text-primary hover:bg-primary/10"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  {t('videosPage.viewRecipe')}
                </Button>
              )}

              {/* Admin SuperLike Button */}
              {isAdmin && (
                <div onClick={(e) => e.stopPropagation()}>
                  <SuperLikeButton
                    submissionId={submission.id}
                    hasSuperLike={submission.hasSuperLike || false}
                    isAdmin={isAdmin}
                    onSuperLikeChange={(hasSuperLike) => onSuperLikeChange(submission.id, hasSuperLike)}
                    chefName={submission.profile?.display_name || 'Chef Anónimo'}
                    dishName={submission.dish_name || 'Plato sin nombre'}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const VideosGallery = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<SubmissionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<SubmissionWithProfile | null>(null);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [recipeModal, setRecipeModal] = useState<SubmissionWithProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'likes' | 'date-desc' | 'date-asc' | 'superlikes'>('likes');

  // Sort and filter function based on current sortBy value
  const sortAndFilterVideos = (videos: SubmissionWithProfile[]): SubmissionWithProfile[] => {
    let filtered = [...videos];
    
    // If superlikes mode, filter to only SuperLiked videos
    if (sortBy === 'superlikes') {
      filtered = filtered.filter(v => v.hasSuperLike);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'likes':
          return b.likes_count - a.likes_count;
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'superlikes':
          // Already filtered, sort by likes
          return b.likes_count - a.likes_count;
        default:
          return b.likes_count - a.likes_count;
      }
    });
  };

  // Group submissions by challenge and sort based on current sortBy
  const { challengeTabs, submissionsByChallenge } = useMemo(() => {
    const grouped: Record<string, SubmissionWithProfile[]> = {};
    const tabs: { id: string; title: string; count: number }[] = [];
    
    // Group by challenge_id
    submissions.forEach(sub => {
      const key = sub.challenge_id;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(sub);
    });
    
    // Sort each group based on sortBy
    Object.keys(grouped).forEach(key => {
      grouped[key] = sortAndFilterVideos(grouped[key]);
      const firstSub = grouped[key][0];
      if (firstSub?.challenges?.title) {
        tabs.push({
          id: key,
          title: firstSub.challenges.title,
          count: grouped[key].length
        });
      }
    });
    
    // Sort tabs by challenge end date (most recent first)
    tabs.sort((a, b) => {
      const aEnd = grouped[a.id][0]?.challenges?.ends_at || '';
      const bEnd = grouped[b.id][0]?.challenges?.ends_at || '';
      return bEnd.localeCompare(aEnd);
    });
    
    // Create "all" sorted/filtered
    grouped['all'] = sortAndFilterVideos([...submissions]);
    
    return { challengeTabs: tabs, submissionsByChallenge: grouped };
  }, [submissions, sortBy]);

  const getRecipeData = (data: unknown): RecipeData | null => {
    if (!data || typeof data !== 'object') return null;
    const recipe = data as RecipeData;
    if (recipe.ingredients || recipe.steps || recipe.utensils) {
      return recipe;
    }
    return null;
  };

  // Check for video ID in URL on load
  useEffect(() => {
    const videoId = searchParams.get('v');
    if (videoId && submissions.length > 0) {
      const video = submissions.find(s => s.id === videoId);
      if (video) {
        setSelectedVideo(video);
        setSearchParams({});
      }
    }
  }, [submissions, searchParams]);

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
          transcription_status,
          challenges (
            title,
            ends_at
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
        .from('profiles')
        .select('user_id, display_name, avatar_url, city')
        .in('user_id', userIds);

      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('video_likes')
          .select('submission_id')
          .eq('user_id', user.id);
        
        userLikes = likesData?.map(l => l.submission_id) || [];
      }

      // Fetch superlikes
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

  const handleLike = async (submissionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: t('videosPage.signInToLike'),
        description: t('videosPage.signInToLikeDesc'),
        variant: 'destructive'
      });
      return;
    }

    // Find the submission
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    // Prevent self-likes
    if (submission.user_id === user.id) {
      toast({
        title: t('videosPage.cantLikeSelf'),
        description: t('videosPage.cantLikeSelfDesc'),
        variant: 'destructive'
      });
      return;
    }

    if (likingIds.has(submissionId)) return;

    setLikingIds(prev => new Set(prev).add(submissionId));

    try {
      if (submission.hasLiked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('submission_id', submissionId);

        setSubmissions(prev => prev.map(s => 
          s.id === submissionId 
            ? { ...s, hasLiked: false, likes_count: Math.max(0, s.likes_count - 1) }
            : s
        ));
        
        if (selectedVideo?.id === submissionId) {
          setSelectedVideo(prev => prev ? { 
            ...prev, 
            hasLiked: false, 
            likes_count: Math.max(0, prev.likes_count - 1) 
          } : null);
        }
      } else {
        const { error } = await supabase
          .from('video_likes')
          .insert({ user_id: user.id, submission_id: submissionId });

        if (error) throw error;

        setSubmissions(prev => prev.map(s => 
          s.id === submissionId 
            ? { ...s, hasLiked: true, likes_count: s.likes_count + 1 }
            : s
        ));

        if (selectedVideo?.id === submissionId) {
          setSelectedVideo(prev => prev ? { 
            ...prev, 
            hasLiked: true, 
            likes_count: prev.likes_count + 1 
          } : null);
        }

        if (submission.user_id !== user.id) {
          toast({
            title: t('videosPage.likeSent'),
            description: t('videosPage.likeSentDesc')
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: t('common.error'),
        description: t('videosPage.errorLike'),
        variant: 'destructive'
      });
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  };

  const getShareUrl = (submissionId: string) => {
    return `${window.location.origin}/videos?v=${submissionId}`;
  };

  const handleShare = async (submissionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getShareUrl(submissionId);
    const submission = submissions.find(s => s.id === submissionId);
    const title = `Mira este vídeo de ${submission?.profile?.display_name || 'un chef'} en MasterChef Fan`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: '¡Vota por este plato en el concurso MasterChef Fan!',
          url: shareUrl
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShowShareModal(submissionId);
        }
      }
    } else {
      setShowShareModal(submissionId);
    }
  };

  const copyToClipboard = async (submissionId: string) => {
    const shareUrl = getShareUrl(submissionId);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: '✅ ' + t('videosPage.linkCopied'),
        description: t('videosPage.shareWithFriends')
      });
      setShowShareModal(null);
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('videosPage.errorLike'),
        variant: 'destructive'
      });
    }
  };

  const shareToWhatsApp = (submissionId: string) => {
    const shareUrl = getShareUrl(submissionId);
    const text = encodeURIComponent(`¡Mira este plato en MasterChef Fan y dale like! ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareModal(null);
  };

  const shareToTwitter = (submissionId: string) => {
    const shareUrl = getShareUrl(submissionId);
    const text = encodeURIComponent('¡Mira este plato en MasterChef Fan! 🍳🔥');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    setShowShareModal(null);
  };

  const shareToTelegram = (submissionId: string) => {
    const shareUrl = getShareUrl(submissionId);
    const text = encodeURIComponent('¡Mira este plato en MasterChef Fan y dale like!');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
    setShowShareModal(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-unbounded text-3xl md:text-4xl font-bold mb-2">
              🎬 <span className="text-gradient-fire">{t('videosPage.title')}</span>
            </h1>
            <p className="text-muted-foreground">
              {t('videosPage.subtitle')}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" />
                {t('videosPage.likeInfo')}
                <Zap className="w-4 h-4 text-primary" />
              </p>
              {isAdmin && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link to="/admin">
                    <Plus className="w-4 h-4" />
                    {t('videosPage.addVideo')}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-unbounded text-xl font-bold mb-2">
                {t('videosPage.noVideosYet')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('videosPage.beFirst')}
              </p>
              <Button asChild className="gap-2">
                <Link to="/dashboard">
                  {t('videosPage.goToDashboard')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
                  >
                    🏆 {t('videosPage.all')} ({submissions.length})
                  </TabsTrigger>
                  {challengeTabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
                    >
                      {tab.title} ({tab.count})
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {/* Sort selector */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="likes">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          {t('videosPage.sortByLikes')}
                        </div>
                      </SelectItem>
                      <SelectItem value="superlikes">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          {t('videosPage.sortBySuperLikes')}
                        </div>
                      </SelectItem>
                      <SelectItem value="date-desc">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {t('videosPage.sortByNewest')}
                        </div>
                      </SelectItem>
                      <SelectItem value="date-asc">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {t('videosPage.sortByOldest')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="all" className="mt-6">
                <VideoGrid 
                  videos={submissionsByChallenge['all'] || []}
                  user={user}
                  isAdmin={isAdmin}
                  likingIds={likingIds}
                  onVideoSelect={setSelectedVideo}
                  onLike={handleLike}
                  onShare={handleShare}
                  onRecipeView={setRecipeModal}
                  onSuperLikeChange={(submissionId, hasSuperLike) => {
                    setSubmissions(prev => prev.map(s => 
                      s.id === submissionId ? { ...s, hasSuperLike } : s
                    ));
                  }}
                  getRecipeData={getRecipeData}
                  showChallenge={true}
                />
              </TabsContent>

              {challengeTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-6">
                  <VideoGrid 
                    videos={submissionsByChallenge[tab.id] || []}
                    user={user}
                    isAdmin={isAdmin}
                    likingIds={likingIds}
                    onVideoSelect={setSelectedVideo}
                    onLike={handleLike}
                    onShare={handleShare}
                    onRecipeView={setRecipeModal}
                    onSuperLikeChange={(submissionId, hasSuperLike) => {
                      setSubmissions(prev => prev.map(s => 
                        s.id === submissionId ? { ...s, hasSuperLike } : s
                      ));
                    }}
                    getRecipeData={getRecipeData}
                    showChallenge={false}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </main>

      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="flex flex-col items-center max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[9/16] h-[70vh] max-w-full bg-black rounded-xl overflow-hidden">
              <video
                src={selectedVideo.video_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={(e) => handleShare(selectedVideo.id, e)}
                  className="flex items-center justify-center w-10 h-10 bg-black/70 backdrop-blur-sm rounded-full hover:bg-black/90 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={(e) => handleLike(selectedVideo.id, e)}
                  disabled={likingIds.has(selectedVideo.id)}
                  className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-black/90 transition-colors"
                >
                  <Heart 
                    className={`w-5 h-5 transition-all ${
                      selectedVideo.hasLiked 
                        ? 'fill-red-500 text-red-500 scale-110' 
                        : 'text-white hover:scale-110'
                    }`} 
                  />
                  <span className="text-white font-medium">
                    {selectedVideo.likes_count}
                  </span>
                </button>
              </div>
            </div>
            <div className="mt-4 text-white max-w-md">
              {/* Challenge title in modal */}
              {selectedVideo.challenges?.title && (
                <p className="text-sm font-medium text-primary mb-2">
                  🏆 {selectedVideo.challenges.title}
                </p>
              )}
              
              {/* Description in modal */}
              {selectedVideo.description && (
                <p className="text-base mb-3">{selectedVideo.description}</p>
              )}
              
              <div className="flex items-center gap-3">
                {renderAvatar(selectedVideo.profile?.avatar_url, 'md')}
                <div>
                  <p className="font-medium">
                    {selectedVideo.profile?.display_name || t('videosPage.anonymousChef')}
                  </p>
                  <p className="text-xs text-white/50">
                    {new Date(selectedVideo.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div 
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(null)}
        >
          <div 
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-unbounded font-bold text-lg">{t('videosPage.shareVideo')}</h3>
              <button 
                onClick={() => setShowShareModal(null)}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => shareToWhatsApp(showShareModal)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="text-xs">WhatsApp</span>
              </button>
              
              <button
                onClick={() => shareToTwitter(showShareModal)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-xs">X/Twitter</span>
              </button>
              
              <button
                onClick={() => shareToTelegram(showShareModal)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <span className="text-xs">Telegram</span>
              </button>
            </div>
            
            <button
              onClick={() => copyToClipboard(showShareModal)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">{t('videosPage.copyLink')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      <Dialog open={!!recipeModal} onOpenChange={() => setRecipeModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-unbounded">
              <ChefHat className="w-5 h-5 text-primary" />
              {t('videosPage.recipe')}
            </DialogTitle>
          </DialogHeader>
          
          {recipeModal && getRecipeData(recipeModal.recipe_data) && (
            <div className="space-y-6">
              {/* Ingredients */}
              {getRecipeData(recipeModal.recipe_data)?.ingredients && 
               getRecipeData(recipeModal.recipe_data)!.ingredients!.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-xs">🥬</span>
                    </div>
                    {t('videosPage.ingredients')}
                  </h3>
                  <ul className="space-y-2">
                    {getRecipeData(recipeModal.recipe_data)!.ingredients!.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              {getRecipeData(recipeModal.recipe_data)?.steps && 
               getRecipeData(recipeModal.recipe_data)!.steps!.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <ListOrdered className="w-3 h-3 text-blue-500" />
                    </div>
                    {t('videosPage.preparation')}
                  </h3>
                  <ol className="space-y-3">
                    {getRecipeData(recipeModal.recipe_data)!.steps!.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Utensils */}
              {getRecipeData(recipeModal.recipe_data)?.utensils && 
               getRecipeData(recipeModal.recipe_data)!.utensils!.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <UtensilsCrossed className="w-3 h-3 text-orange-500" />
                    </div>
                    Utensilios
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getRecipeData(recipeModal.recipe_data)!.utensils!.map((utensil, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1 rounded-full bg-muted text-sm"
                      >
                        {utensil}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default VideosGallery;