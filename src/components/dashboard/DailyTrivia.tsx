import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Loader2, 
  Check, 
  X, 
  RefreshCw,
  Sparkles,
  Trophy,
  Lightbulb
} from 'lucide-react';

interface Challenge {
  type: string;
  title: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  fun_fact: string;
  difficulty: string;
  energy_reward: number;
}

interface DailyTriviaProps {
  onEnergyEarned?: (amount: number) => void;
}

export const DailyTrivia = ({ onEnergyEarned }: DailyTriviaProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(false);

  const fetchChallenge = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setHasAnswered(false);
    
    try {
      const response = await supabase.functions.invoke('generate-daily-challenge');
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setChallenge(response.data);
    } catch (error) {
      console.error('Error fetching challenge:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el reto. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user already completed today's challenge
  useEffect(() => {
    const checkTodayCompletion = () => {
      const today = new Date().toDateString();
      const lastCompleted = localStorage.getItem(`trivia_completed_${user?.id}`);
      if (lastCompleted === today) {
        setTodayCompleted(true);
        setLoading(false);
      } else {
        fetchChallenge();
      }
    };

    if (user) {
      checkTodayCompletion();
    }
  }, [user]);

  const handleAnswer = async (answerIndex: number) => {
    if (hasAnswered || !challenge) return;

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    const correct = answerIndex === challenge.correct_answer;
    setIsCorrect(correct);

    if (correct && user) {
      // Mark as completed for today
      const today = new Date().toDateString();
      localStorage.setItem(`trivia_completed_${user.id}`, today);
      
      // Update energy in profiles
      try {
        const { error } = await supabase.rpc('increment_user_energy', {
          p_user_id: user.id,
          p_amount: challenge.energy_reward
        });
        
        if (!error) {
          onEnergyEarned?.(challenge.energy_reward);
          toast({
            title: '🎉 ¡Correcto!',
            description: `Has ganado +${challenge.energy_reward} de energía`
          });
        }
      } catch (e) {
        // Fallback: just show success
        toast({
          title: '🎉 ¡Correcto!',
          description: `Has ganado +${challenge.energy_reward} de energía`
        });
      }
    } else if (!correct) {
      toast({
        title: '❌ Incorrecto',
        description: 'No te preocupes, ¡mañana hay otro reto!'
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'fácil': return 'text-green-500 bg-green-500/10';
      case 'medio': return 'text-yellow-500 bg-yellow-500/10';
      case 'difícil': return 'text-red-500 bg-red-500/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'trivia': return '🧠';
      case 'guess_dish': return '🍽️';
      case 'ingredient': return '🥄';
      case 'technique': return '👨‍🍳';
      case 'origin': return '🌍';
      default: return '⚡';
    }
  };

  if (todayCompleted && !hasAnswered) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="font-unbounded font-bold text-lg mb-2">¡Reto completado!</h3>
          <p className="text-muted-foreground">
            Vuelve mañana para un nuevo reto culinario
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Generando tu reto del día...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No se pudo cargar el reto</p>
          <Button onClick={fetchChallenge} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-orange-500/20 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xl">
              {getTypeEmoji(challenge.type)}
            </div>
            <div>
              <h3 className="font-unbounded font-bold">{challenge.title}</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
                <span className="text-muted-foreground">Mini Reto Diario</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary font-bold">
            <Zap className="w-4 h-4" />
            +{challenge.energy_reward}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <p className="text-lg mb-6">{challenge.question}</p>

        {/* Options */}
        <div className="space-y-3">
          {challenge.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = index === challenge.correct_answer;
            
            let optionClass = "w-full p-4 rounded-xl border text-left transition-all ";
            
            if (hasAnswered) {
              if (isCorrectOption) {
                optionClass += "border-green-500 bg-green-500/10 text-green-500";
              } else if (isSelected && !isCorrectOption) {
                optionClass += "border-red-500 bg-red-500/10 text-red-500";
              } else {
                optionClass += "border-border opacity-50";
              }
            } else {
              optionClass += isSelected 
                ? "border-primary bg-primary/10" 
                : "border-border hover:border-primary/50 hover:bg-muted/50";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={hasAnswered}
                className={optionClass}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </span>
                  {hasAnswered && isCorrectOption && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {hasAnswered && isSelected && !isCorrectOption && (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Result & Explanation */}
        {hasAnswered && (
          <div className="mt-6 space-y-4 animate-fade-in">
            {/* Explanation */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Explicación</p>
                  <p className="text-sm text-muted-foreground">{challenge.explanation}</p>
                </div>
              </div>
            </div>

            {/* Fun Fact */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">¿Sabías que...?</p>
                  <p className="text-sm text-muted-foreground">{challenge.fun_fact}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
