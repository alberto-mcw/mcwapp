import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SuperLikeButtonProps {
  submissionId: string;
  hasSuperLike: boolean;
  isAdmin: boolean;
  onSuperLikeChange: (hasSuperLike: boolean) => void;
  chefName: string;
  dishName: string;
}

export const SuperLikeButton = ({
  submissionId,
  hasSuperLike,
  isAdmin,
  onSuperLikeChange,
  chefName,
  dishName
}: SuperLikeButtonProps) => {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (hasSuperLike) {
        // Remove superlike
        const { error } = await supabase
          .from('super_likes')
          .delete()
          .eq('submission_id', submissionId);

        if (error) throw error;

        toast({
          title: '⭐ SuperLike eliminado',
          description: 'Se han restado 50 puntos al chef'
        });
        onSuperLikeChange(false);
      } else {
        // Add superlike
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated');

        const { error } = await supabase
          .from('super_likes')
          .insert({
            submission_id: submissionId,
            admin_user_id: user.id
          });

        if (error) {
          if (error.code === '23505') {
            // Unique constraint violation - superlike already exists
            toast({
              title: 'Ya tiene SuperLike',
              description: 'Este vídeo ya ha recibido un SuperLike',
              variant: 'destructive'
            });
            return;
          }
          throw error;
        }

        toast({
          title: '🌟 ¡SuperLike otorgado!',
          description: `${chefName} ha recibido 50 puntos`
        });
        onSuperLikeChange(true);
      }
    } catch (error) {
      console.error('Error managing superlike:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar el SuperLike',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Button
        variant={hasSuperLike ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={loading}
        className={`gap-1 ${hasSuperLike 
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0' 
          : 'border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10'
        }`}
      >
        <Star className={`w-4 h-4 ${hasSuperLike ? 'fill-white' : ''}`} />
        {hasSuperLike ? 'SuperLike ✓' : 'SuperLike'}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {hasSuperLike ? 'Revocar SuperLike' : 'Confirmar SuperLike'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              {hasSuperLike ? (
                <>
                  <p>¿Estás seguro de que quieres <strong>revocar</strong> el SuperLike de "{dishName}"?</p>
                  <p className="text-destructive font-medium">Se restarán 50 puntos a {chefName}.</p>
                </>
              ) : (
                <>
                  <p>¿Estás seguro de que quieres dar un <strong>SuperLike</strong> a "{dishName}" de {chefName}?</p>
                  <p className="text-primary font-medium">Esta acción otorgará 50 puntos de energía extra y el vídeo será promocionado en las redes oficiales.</p>
                  <p className="text-sm text-muted-foreground mt-2">Solo puede haber un SuperLike por vídeo.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              className={hasSuperLike 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
              }
            >
              {loading ? 'Procesando...' : (hasSuperLike ? 'Revocar SuperLike' : 'Dar SuperLike')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
