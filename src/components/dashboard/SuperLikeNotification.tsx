import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, PartyPopper, ChefHat, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuperLikeData {
  id: string;
  submission_id: string;
  created_at: string;
  challenge_title: string;
  dish_name: string;
}

interface SuperLikeNotificationProps {
  userId: string;
}

export const SuperLikeNotification = ({ userId }: SuperLikeNotificationProps) => {
  const [superLikes, setSuperLikes] = useState<SuperLikeData[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuperLikes = async () => {
      try {
        // Get user's submissions that have received superlikes
        const { data: submissions } = await supabase
          .from('challenge_submissions')
          .select(`
            id,
            dish_name,
            challenge_id,
            challenges (title)
          `)
          .eq('user_id', userId);

        if (!submissions || submissions.length === 0) {
          setLoading(false);
          return;
        }

        const submissionIds = submissions.map(s => s.id);

        // Get superlikes for these submissions
        const { data: superLikesData } = await supabase
          .from('super_likes')
          .select('id, submission_id, created_at')
          .in('submission_id', submissionIds);

        if (superLikesData && superLikesData.length > 0) {
          const enrichedData = superLikesData.map(sl => {
            const submission = submissions.find(s => s.id === sl.submission_id);
            return {
              ...sl,
              challenge_title: submission?.challenges?.title || 'Desafío Semanal',
              dish_name: submission?.dish_name || 'tu receta'
            };
          });
          setSuperLikes(enrichedData);
        }
      } catch (error) {
        console.error('Error fetching superlikes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuperLikes();

    // Load dismissed IDs from localStorage
    const stored = localStorage.getItem('dismissed_superlike_notifications');
    if (stored) {
      setDismissedIds(new Set(JSON.parse(stored)));
    }
  }, [userId]);

  const dismissNotification = (id: string) => {
    const newDismissed = new Set(dismissedIds).add(id);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_superlike_notifications', JSON.stringify([...newDismissed]));
  };

  if (loading) return null;

  const visibleSuperLikes = superLikes.filter(sl => !dismissedIds.has(sl.id));

  if (visibleSuperLikes.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      {visibleSuperLikes.map((superLike) => (
        <div 
          key={superLike.id}
          className="relative bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-2 border-primary/50 rounded-2xl p-6 overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute top-2 right-2 opacity-20">
            <Sparkles className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute bottom-2 left-2 opacity-20">
            <ChefHat className="w-12 h-12 text-primary" />
          </div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 hover:bg-black/20"
            onClick={() => dismissNotification(superLike.id)}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="relative z-10">
            {/* Header with emojis */}
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper className="w-6 h-6 text-primary" />
              <span className="text-2xl">🍳🎉🏆👨‍🍳🌟</span>
              <PartyPopper className="w-6 h-6 text-primary" />
            </div>

            {/* Main message */}
            <p className="text-foreground leading-relaxed">
              <span className="font-semibold text-primary">¡Estamos encantados de informarte</span> de que tu receta ha sido incluida entre las mejores del <span className="font-bold text-primary">{superLike.challenge_title}</span>, por lo que obtienes <span className="font-bold text-primary"><span className="font-semibold text-primary">¡Estamos encantados de informarte</span> de que tu receta ha sido incluida entre las mejores del <span className="font-bold text-primary">{superLike.challenge_title}</span>, por lo que obtienes <span className="font-bold text-primary">50 puntos extra</span>. <span className="font-semibold">¡Enhorabuena!</span></span>. <span className="font-semibold">¡Enhorabuena!</span>
            </p>
            
            <p className="text-foreground leading-relaxed mt-3">
              Además, las redes sociales de <span className="font-bold">MasterChef World</span> subirán próximamente tu vídeo, y por supuesto a tu perfil en Instagram se le hará colaborador. Por favor, <span className="italic">no subas por tu cuenta el vídeo</span> y para cualquier duda ponte en contacto con nosotros.
            </p>

            <p className="text-foreground font-semibold mt-3">
              ¡Buen trabajo! No olvides limpiar la cocina... 🧹✨
            </p>

            {/* Footer emojis */}
            <div className="flex justify-center gap-1 mt-4 text-2xl">
              <span>🍴</span>
              <span>🎊</span>
              <span>👏</span>
              <span>🔥</span>
              <span>💪</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
