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
  Sparkles,
  Trophy,
  Lightbulb,
  Clock
} from 'lucide-react';

// Points for on-time trivias (from points document)
const ON_TIME_TRIVIA_CORRECT_POINTS = 30;
const ON_TIME_TRIVIA_WRONG_POINTS = 2;

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
  effectiveDate: string; // Changed from 'date' to track CET effective date
}

interface DailyTriviaProps {
  onEnergyEarned?: (amount: number) => void;
}

// Get the effective trivia date based on 8 AM CET reset
const getEffectiveTriviaDate = (): string => {
  const now = new Date();
  
  // Convert to CET (UTC+1) or CEST (UTC+2)
  // Using Europe/Madrid timezone for accurate CET/CEST handling
  const cetFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false
  });
  
  const parts = cetFormatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  
  // If before 8 AM CET, use yesterday's date
  if (hour < 8) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yParts = cetFormatter.formatToParts(yesterday);
    return `${yParts.find(p => p.type === 'year')?.value}-${yParts.find(p => p.type === 'month')?.value}-${yParts.find(p => p.type === 'day')?.value}`;
  }
  
  return `${year}-${month}-${day}`;
};

// Get time until next 8 AM CET reset
const getTimeUntilReset = (): { hours: number; minutes: number } => {
  const now = new Date();
  
  // Create next 8 AM CET
  const cetFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    hour12: false
  });
  const currentHour = parseInt(cetFormatter.format(now));
  
  let hoursUntil: number;
  if (currentHour >= 8) {
    // Next reset is tomorrow at 8 AM
    hoursUntil = 24 - currentHour + 8;
  } else {
    // Next reset is today at 8 AM
    hoursUntil = 8 - currentHour;
  }
  
  const minutesUntil = 60 - now.getMinutes();
  if (minutesUntil < 60) {
    hoursUntil -= 1;
  }
  
  return { hours: Math.max(0, hoursUntil), minutes: minutesUntil % 60 };
};

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
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());

  const getStorageKey = () => `trivia_result_${user?.id}`;

  const fetchChallenge = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setHasAnswered(false);
    
    try {
      const effectiveDate = getEffectiveTriviaDate();
      const { data: trivia, error: triviaError } = await supabase
        .from('daily_trivias_public' as any)
        .select('*')
        .eq('scheduled_date', effectiveDate)
        .maybeSingle();

      if (trivia && !triviaError) {
        const triviaData = trivia as any;
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
        // No hay trivia programada para hoy - mostrar mensaje
        setChallenge(null);
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el mini reto. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Migrate localStorage data to database (one-time migration)
  const migrateLocalStorageToDb = async (savedResult: SavedResult) => {
    if (!user || !savedResult.challenge.id) return;
    
    try {
      // Check if already migrated
      const { data: existing } = await supabase
        .from('trivia_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('trivia_id', savedResult.challenge.id)
        .maybeSingle();
      
      if (!existing) {
        // Migrate to database
        await supabase
          .from('trivia_completions')
          .insert({
            user_id: user.id,
            trivia_id: savedResult.challenge.id,
            is_correct: savedResult.isCorrect,
            selected_answer: savedResult.selectedAnswer,
            energy_earned: savedResult.energyEarned
          });
        console.log('Migrated trivia completion to database:', savedResult.challenge.id);
      }
    } catch (e) {
      console.error('Error migrating trivia completion:', e);
    }
  };

  // Check if user already completed today's trivia
  useEffect(() => {
    const checkTodayCompletion = async () => {
      const effectiveDate = getEffectiveTriviaDate();
      const storageKey = getStorageKey();
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        try {
          const parsed: SavedResult = JSON.parse(savedData);
          // Check if it's from the current effective date (8 AM CET cycle)
          if (parsed.effectiveDate === effectiveDate) {
            // Migrate to database if needed
            await migrateLocalStorageToDb(parsed);
            
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
            // Before clearing, try to migrate old result
            if (parsed.challenge.id) {
              await migrateLocalStorageToDb(parsed);
            }
            // Clear old result
            localStorage.removeItem(storageKey);
          }
        } catch (e) {
          localStorage.removeItem(storageKey);
        }
      }
      
      // Also check database for today's completion
      if (user) {
        try {
          const { data: dbCompletion } = await supabase
            .from('trivia_completions')
            .select('*, daily_trivias!inner(title, question, options, difficulty, energy_reward)')
            .eq('user_id', user.id)
            .eq('daily_trivias.scheduled_date', effectiveDate)
            .maybeSingle();
          
          if (dbCompletion) {
            // User already completed today's trivia (found in DB)
            const triviaData = dbCompletion.daily_trivias as any;
            setChallenge({
              id: dbCompletion.trivia_id,
              type: 'trivia',
              title: triviaData.title,
              question: triviaData.question,
              options: triviaData.options,
              difficulty: triviaData.difficulty,
              energy_reward: triviaData.energy_reward
            });
            setSelectedAnswer(dbCompletion.selected_answer);
            setIsCorrect(dbCompletion.is_correct);
            setHasAnswered(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error checking DB completion:', e);
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
        // Use standardized points (30 correct / 2 wrong)
        energyEarned = correct ? ON_TIME_TRIVIA_CORRECT_POINTS : ON_TIME_TRIVIA_WRONG_POINTS;
      } else {
        // AI-generated challenge
        correct = answerIndex === challenge.correct_answer;
        resultCorrectAnswer = challenge.correct_answer!;
        resultExplanation = challenge.explanation || '';
        resultFunFact = challenge.fun_fact || '';
        energyEarned = correct ? ON_TIME_TRIVIA_CORRECT_POINTS : ON_TIME_TRIVIA_WRONG_POINTS;
      }

      setHasAnswered(true);
      setIsCorrect(correct);
      setCorrectAnswer(resultCorrectAnswer);
      setExplanation(resultExplanation);
      setFunFact(resultFunFact);

      // Save result to localStorage using effective date (8 AM CET cycle)
      const effectiveDate = getEffectiveTriviaDate();
      const resultToSave: SavedResult = {
        challenge,
        selectedAnswer: answerIndex,
        correctAnswer: resultCorrectAnswer,
        isCorrect: correct,
        explanation: resultExplanation,
        funFact: resultFunFact,
        energyEarned,
        effectiveDate
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(resultToSave));

      // Save trivia completion to database
      if (user && challenge.id) {
        try {
          await supabase
            .from('trivia_completions')
            .upsert({
              user_id: user.id,
              trivia_id: challenge.id,
              is_correct: correct,
              selected_answer: answerIndex,
              energy_earned: energyEarned
            }, { onConflict: 'user_id,trivia_id' });
        } catch (e) {
          console.error('Error saving trivia completion:', e);
        }
      }

      if (user) {
        // Update energy in profiles (both correct and wrong get points now)
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
                total_energy: profile.total_energy + energyEarned,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
          }
          
          onEnergyEarned?.(energyEarned);
          
          if (correct) {
            toast({
              title: '🎉 ¡Correcto!',
              description: `Has ganado +${energyEarned} puntos`
            });
          } else {
            toast({
              title: '❌ Incorrecto',
              description: `+${energyEarned} puntos de participación. ¡Mañana hay otro reto!`
            });
          }
        } catch (e) {
          console.error('Error updating energy:', e);
          toast({
            title: correct ? '🎉 ¡Correcto!' : '❌ Incorrecto',
            description: correct 
              ? `Has ganado +${energyEarned} puntos`
              : `+${energyEarned} puntos de participación`
          });
        }
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
          <p className="text-muted-foreground">Cargando tu mini reto del día...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-unbounded font-bold mb-2">Sin mini reto hoy</h3>
          <p className="text-muted-foreground mb-4">No hay mini reto programado para hoy.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Próximo mini reto a las 8:00 AM (CET)</span>
          </div>
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
            +{ON_TIME_TRIVIA_CORRECT_POINTS}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              (+{ON_TIME_TRIVIA_WRONG_POINTS} si fallas)
            </span>
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
                  ? `Ganaste +${ON_TIME_TRIVIA_CORRECT_POINTS} de energía` 
                  : `+${ON_TIME_TRIVIA_WRONG_POINTS} energía de participación`}
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

            {/* Next trivia countdown */}
            <div className="text-center pt-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Próxima trivia en {timeUntilReset.hours}h {timeUntilReset.minutes}m (8:00 AM CET)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};