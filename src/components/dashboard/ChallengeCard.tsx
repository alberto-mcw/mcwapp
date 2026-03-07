import { useState } from 'react';
import { Challenge } from '@/hooks/useChallenges';
import { Button } from '@/components/ui/button';
import { Flame, Check, Lock, Loader2, Calendar, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChallengeCardProps {
  type: 'daily' | 'weekly';
  challenge: Challenge | null;
  isCompleted: boolean;
  onComplete: (challengeId: string, energyReward: number) => Promise<{ error: Error | null }>;
}

export const ChallengeCard = ({ type, challenge, isCompleted, onComplete }: ChallengeCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isDaily = type === 'daily';
  const title = isDaily ? 'Mini Reto Diario' : 'Desafío Semanal';
  const icon = isDaily ? '⚡' : '🏆';
  const accentClass = isDaily ? 'from-yellow-500 to-orange-500' : 'from-purple-500 to-pink-500';

  const handleComplete = async () => {
    if (!challenge) return;
    
    setIsLoading(true);
    const { error } = await onComplete(challenge.id, challenge.energy_reward);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar el reto',
        variant: 'destructive'
      });
    } else {
      toast({
        title: '🎉 ¡Reto completado!',
        description: `Has ganado +${challenge.energy_reward} puntos`
      });
    }
  };

  if (!challenge) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 opacity-60">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentClass} flex items-center justify-center text-xl`}>
            {icon}
          </div>
          <div>
            <h3 className="font-unbounded font-bold">{title}</h3>
            <p className="text-xs text-muted-foreground">No disponible</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Lock className="w-5 h-5 mr-2" />
          <span>Próximamente</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border rounded-2xl p-6 transition-all ${
      isCompleted 
        ? 'border-green-500/50 bg-green-500/5' 
        : 'border-border hover:border-primary/50'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentClass} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-unbounded font-bold">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              Hasta {new Date(challenge.ends_at).toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-primary font-bold">
          <Zap className="w-4 h-4" />
          +{challenge.energy_reward}
        </div>
      </div>

      {/* Challenge Content */}
      <div className="mb-4">
        <h4 className="font-semibold mb-1">{challenge.title}</h4>
        <p className="text-sm text-muted-foreground">{challenge.description}</p>
      </div>

      {/* Action Button */}
      {isCompleted ? (
        <Button disabled className="w-full bg-green-500/20 text-green-500 border-green-500/30">
          <Check className="w-4 h-4 mr-2" />
          Completado
        </Button>
      ) : (
        <Button 
          onClick={handleComplete} 
          disabled={isLoading}
          className="w-full btn-fire"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Flame className="w-4 h-4 mr-2" />
          )}
          Marcar como completado
        </Button>
      )}
    </div>
  );
};
