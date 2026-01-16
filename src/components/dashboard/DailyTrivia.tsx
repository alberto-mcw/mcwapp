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
  id?: string;
  type: string;
  title: string;
  question: string;
  options: string[];
  correct_answer?: number;
  explanation?: string;
  fun_fact?: string;
  difficulty: string;
  energy_reward: number;
}

interface SavedResult {
  challenge: Challenge;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
  funFact: string;
  energyEarned: number;
  date: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [funFact, setFunFact] = useState<string>('');

  const getStorageKey = () => `trivia_result_${user?.id}`;

  const fetchChallenge = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setHasAnswered(false);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: approvedTrivia, error: triviaError } = await supabase
        .from('daily_trivias_public' as any)
        .select('*')
        .eq('scheduled_date', today)
        .eq('status', 'approved')
        .maybeSingle();

      if (approvedTrivia && !triviaError) {
        const triviaData = approvedTrivia as any;
        const options = typeof triviaData.options === 'string' 
          ? JSON.parse(triviaData.options) 
          : triviaData.options;
        
        setChallenge({
          id: triviaData.id,
          type: triviaData.trivia_type,
          title: triviaData.title,
          question: triviaData.question,
          options: options,
          difficulty: triviaData.difficulty,
          energy_reward: triviaData.energy_reward
        });
      } else {
        const response = await supabase.functions.invoke('generate-daily-challenge');
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        setChallenge(response.data);
      }
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
      const today = new Date().toISOString().split('T')[0];
      const storageKey = getStorageKey();
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        try {
          const parsed: SavedResult = JSON.parse(savedData);
          // Check if it's from today
          if (parsed.date === today) {
            // Restore the saved result
            setSavedResult(parsed);
            setChallenge(parsed.challenge);
            setSelectedAnswer(parsed.selectedAnswer);
            setCorrectAnswer(parsed.correctAnswer);
            setIsCorrect(parsed.isCorrect);
            setExplanation(parsed.explanation);
            setFunFact(parsed.funFact);
            setHasAnswered(true);
            setLoading(false);
            return;
          } else {
            // Clear old result
            localStorage.removeItem(storageKey);
          }
        } catch (e) {
          localStorage.removeItem(storageKey);
        }
      }
      
      fetchChallenge();
    };

    if (user) {
      checkTodayCompletion();
    }
  }, [user]);

  const handleAnswer = async (answerIndex: number) => {
    if (hasAnswered || !challenge || isSubmitting) return;

    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);

    try {
      let correct: boolean;
      let resultCorrectAnswer: number;
      let resultExplanation: string;
      let resultFunFact: string;
      let energyEarned: number;

      // If it's a database trivia, use the RPC to check answer securely
      if (challenge.id) {
        const { data, error } = await supabase.rpc('check_trivia_answer', {
          p_trivia_id: challenge.id,
          p_selected_answer: answerIndex
        });

        if (error) {
          throw new Error('Error verificando respuesta');
        }

        const rpcResult = data as any;
        if (rpcResult?.error) {
          throw new Error(rpcResult.error);
        }

        correct = rpcResult.is_correct;
        resultCorrectAnswer = rpcResult.correct_answer;
        resultExplanation = rpcResult.explanation;
        resultFunFact = rpcResult.fun_fact;
        energyEarned = rpcResult.energy_reward;
      } else {
        // AI-generated challenge
        correct = answerIndex === challenge.correct_answer;
        resultCorrectAnswer = challenge.correct_answer!;
        resultExplanation = challenge.explanation || '';
        resultFunFact = challenge.fun_fact || '';
        energyEarned = correct ? challenge.energy_reward : 0;
      }

      setHasAnswered(true);
      setIsCorrect(correct);
      setCorrectAnswer(resultCorrectAnswer);
      setExplanation(resultExplanation);
      setFunFact(resultFunFact);

      // Save result to localStorage
      const today = new Date().toISOString().split('T')[0];
      const resultToSave: SavedResult = {
        challenge,
        selectedAnswer: answerIndex,
        correctAnswer: resultCorrectAnswer,
        isCorrect: correct,
        explanation: resultExplanation,
        funFact: resultFunFact,
        energyEarned,
        date: today
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(resultToSave));

      if (correct && user) {
        // Update energy in profiles
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('total_energy')
            .eq('user_id', user.id)
            .single();
          
          if (profile) {
            await supabase
              .from('profiles')
              .update({ 
                total_energy: profile.total_energy + challenge.energy_reward,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
          }
          
          onEnergyEarned?.(challenge.energy_reward);
          toast({
            title: '🎉 ¡Correcto!',
            description: `Has ganado +${challenge.energy_reward} de energía`
          });
        } catch (e) {
          console.error('Error updating energy:', e);
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
    } catch (error) {
      console.error('Error handling answer:', error);
      toast({
        title: 'Error',
        description: 'Error al verificar la respuesta',
        variant: 'destructive'
      });
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
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

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando tu reto del día...</p>
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

        {/* Completed badge when viewing saved result */}
        {savedResult && (
          <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {isCorrect ? (
                <Trophy className="w-5 h-5 text-green-500" />
              ) : (
                <X className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {isCorrect ? '¡Acertaste!' : 'Respuesta incorrecta'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isCorrect 
                  ? `Ganaste +${challenge.energy_reward} de energía` 
                  : 'Vuelve mañana para un nuevo reto'}
              </p>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {challenge.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = hasAnswered && correctAnswer !== null && index === correctAnswer;
            
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
                disabled={hasAnswered || isSubmitting}
                className={optionClass}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </span>
                  {isSubmitting && isSelected && (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
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
        {hasAnswered && explanation && (
          <div className="mt-6 space-y-4 animate-fade-in">
            {/* Explanation */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Explicación</p>
                  <p className="text-sm text-muted-foreground">{explanation}</p>
                </div>
              </div>
            </div>

            {/* Fun Fact */}
            {funFact && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">¿Sabías que...?</p>
                    <p className="text-sm text-muted-foreground">{funFact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next challenge info */}
            <div className="text-center pt-2 text-sm text-muted-foreground">
              El próximo reto estará disponible mañana
            </div>
          </div>
        )}
      </div>
    </div>
  );
};