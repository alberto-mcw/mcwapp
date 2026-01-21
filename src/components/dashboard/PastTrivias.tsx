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
  Clock,
  ChevronDown,
  ChevronUp,
  History,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Points for late trivias (from points document)
const LATE_TRIVIA_CORRECT_POINTS = 15;
const LATE_TRIVIA_WRONG_POINTS = 1;

interface PastTrivia {
  id: string;
  title: string;
  question: string;
  options: string[];
  difficulty: string;
  energy_reward: number;
  scheduled_date: string;
  correct_answer?: number;
  explanation?: string;
  fun_fact?: string;
}

interface TriviaCompletion {
  trivia_id: string;
  is_correct: boolean;
  selected_answer: number;
  energy_earned: number;
}

interface PastTriviasProps {
  onEnergyEarned?: (amount: number) => void;
}

// Get the effective trivia date based on 8 AM CET reset
const getEffectiveTriviaDate = (): string => {
  const now = new Date();
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
  
  if (hour < 8) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yParts = cetFormatter.formatToParts(yesterday);
    return `${yParts.find(p => p.type === 'year')?.value}-${yParts.find(p => p.type === 'month')?.value}-${yParts.find(p => p.type === 'day')?.value}`;
  }
  
  return `${year}-${month}-${day}`;
};

// Get dates for past week (excluding today)
const getPastWeekDates = (): string[] => {
  const effectiveToday = getEffectiveTriviaDate();
  const dates: string[] = [];
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(effectiveToday);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

const TriviaCard = ({ 
  trivia, 
  completion, 
  onAnswer 
}: { 
  trivia: PastTrivia; 
  completion: TriviaCompletion | null;
  onAnswer: (triviaId: string, answer: number) => Promise<void>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(completion?.selected_answer ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(!!completion);
  const [isCorrect, setIsCorrect] = useState(completion?.is_correct ?? false);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [funFact, setFunFact] = useState<string>('');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'fácil': return 'text-green-500 bg-green-500/10';
      case 'medio': return 'text-yellow-500 bg-yellow-500/10';
      case 'difícil': return 'text-red-500 bg-red-500/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (hasAnswered || isSubmitting) return;
    
    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);
    
    try {
      await onAnswer(trivia.id, answerIndex);
      
      // The parent will refetch, but we need to get the result
      const { data } = await supabase.rpc('check_trivia_answer', {
        p_trivia_id: trivia.id,
        p_selected_answer: answerIndex
      });
      
      if (data) {
        const result = data as any;
        setIsCorrect(result.is_correct);
        setCorrectAnswer(result.correct_answer);
        setExplanation(result.explanation || '');
        setFunFact(result.fun_fact || '');
        setHasAnswered(true);
      }
    } catch (error) {
      console.error('Error answering trivia:', error);
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate points for late trivia
  const pointsToEarn = hasAnswered 
    ? (isCorrect ? LATE_TRIVIA_CORRECT_POINTS : LATE_TRIVIA_WRONG_POINTS)
    : LATE_TRIVIA_CORRECT_POINTS;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card/50">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            {hasAnswered ? (
              isCorrect ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )
            ) : (
              <History className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{trivia.title}</p>
            <p className="text-xs text-muted-foreground">{formatDate(trivia.scheduled_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            getDifficultyColor(trivia.difficulty)
          )}>
            {trivia.difficulty}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            +{hasAnswered ? (isCorrect ? LATE_TRIVIA_CORRECT_POINTS : LATE_TRIVIA_WRONG_POINTS) : `${LATE_TRIVIA_WRONG_POINTS}-${LATE_TRIVIA_CORRECT_POINTS}`}
          </div>
          {hasAnswered && (
            <div className={cn(
              "w-2 h-2 rounded-full",
              isCorrect ? "bg-green-500" : "bg-red-500"
            )} />
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 border-t border-border space-y-4">
          <p className="text-sm">{trivia.question}</p>
          
          {/* Info banner for late trivias */}
          {!hasAnswered && (
            <div className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Mini reto pasado: +{LATE_TRIVIA_CORRECT_POINTS} si aciertas, +{LATE_TRIVIA_WRONG_POINTS} si fallas
            </div>
          )}

          {/* Options */}
          <div className="space-y-2">
            {trivia.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = hasAnswered && correctAnswer !== null && index === correctAnswer;
              
              let optionClass = "w-full p-3 rounded-lg border text-left text-sm transition-all ";
              
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
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </span>
                    {isSubmitting && isSelected && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {hasAnswered && isCorrectOption && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result */}
          {hasAnswered && (
            <div className="space-y-3 pt-2">
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-2",
                isCorrect ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {isCorrect 
                    ? `¡Correcto! +${LATE_TRIVIA_CORRECT_POINTS} energía` 
                    : `Incorrecto. +${LATE_TRIVIA_WRONG_POINTS} energía de participación`}
                </span>
              </div>

              {explanation && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium mb-1">Explicación</p>
                      <p className="text-xs text-muted-foreground">{explanation}</p>
                    </div>
                  </div>
                </div>
              )}

              {funFact && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium mb-1">¿Sabías que...?</p>
                      <p className="text-xs text-muted-foreground">{funFact}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const PastTrivias = ({ onEnergyEarned }: PastTriviasProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pastTrivias, setPastTrivias] = useState<PastTrivia[]>([]);
  const [completions, setCompletions] = useState<TriviaCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchPastTrivias = async () => {
    if (!user) return;
    
    try {
      const pastDates = getPastWeekDates();
      
      // Fetch past trivias
      const { data: trivias, error } = await supabase
        .from('daily_trivias_public' as any)
        .select('*')
        .in('scheduled_date', pastDates)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      if (trivias) {
        const parsedTrivias = (trivias as any[]).map(t => ({
          ...t,
          options: typeof t.options === 'string' ? JSON.parse(t.options) : t.options
        }));
        setPastTrivias(parsedTrivias);

        // Fetch user completions for these trivias
        const triviaIds = parsedTrivias.map(t => t.id);
        if (triviaIds.length > 0) {
          const { data: userCompletions } = await supabase
            .from('trivia_completions')
            .select('trivia_id, is_correct, selected_answer, energy_earned')
            .eq('user_id', user.id)
            .in('trivia_id', triviaIds);

          if (userCompletions) {
            setCompletions(userCompletions);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching past trivias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastTrivias();
  }, [user]);

  const handleAnswer = async (triviaId: string, answerIndex: number) => {
    if (!user) return;

    try {
      // Check answer via RPC
      const { data, error } = await supabase.rpc('check_trivia_answer', {
        p_trivia_id: triviaId,
        p_selected_answer: answerIndex
      });

      if (error) throw error;

      const result = data as any;
      const isCorrect = result.is_correct;
      
      // Calculate late points (different from on-time points)
      const energyEarned = isCorrect ? LATE_TRIVIA_CORRECT_POINTS : LATE_TRIVIA_WRONG_POINTS;

      // Save to trivia_completions
      await supabase
        .from('trivia_completions')
        .upsert({
          user_id: user.id,
          trivia_id: triviaId,
          is_correct: isCorrect,
          selected_answer: answerIndex,
          energy_earned: energyEarned
        }, { onConflict: 'user_id,trivia_id' });

      // Update user energy
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
      
      toast({
        title: isCorrect ? '🎉 ¡Correcto!' : '❌ Incorrecto',
        description: `+${energyEarned} energía ${!isCorrect ? '(participación)' : ''}`
      });

      // Refresh completions
      fetchPastTrivias();
    } catch (error) {
      console.error('Error answering past trivia:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar tu respuesta',
        variant: 'destructive'
      });
    }
  };

  const getCompletionForTrivia = (triviaId: string) => {
    return completions.find(c => c.trivia_id === triviaId) || null;
  };

  // Filter out trivias already completed
  const uncompletedTrivias = pastTrivias.filter(
    t => !completions.find(c => c.trivia_id === t.id)
  );
  const completedTrivias = pastTrivias.filter(
    t => completions.find(c => c.trivia_id === t.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pastTrivias.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <h3 className="font-unbounded font-bold text-sm">Mini Retos Anteriores</h3>
            <p className="text-xs text-muted-foreground">
              {uncompletedTrivias.length > 0 
                ? `${uncompletedTrivias.length} pendiente${uncompletedTrivias.length > 1 ? 's' : ''} de responder`
                : 'Todos completados esta semana'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uncompletedTrivias.length > 0 && (
            <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
              +{LATE_TRIVIA_WRONG_POINTS}-{LATE_TRIVIA_CORRECT_POINTS} pts
            </span>
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
        <div className="p-4 pt-0 space-y-3">
          <p className="text-xs text-muted-foreground">
            Responde mini retos de la última semana con puntos reducidos
          </p>
          
          {/* Uncompleted trivias first */}
          {uncompletedTrivias.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Sin responder</p>
              {uncompletedTrivias.map(trivia => (
                <TriviaCard
                  key={trivia.id}
                  trivia={trivia}
                  completion={null}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>
          )}

          {/* Completed trivias */}
          {completedTrivias.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Completados</p>
              {completedTrivias.map(trivia => (
                <TriviaCard
                  key={trivia.id}
                  trivia={trivia}
                  completion={getCompletionForTrivia(trivia.id)}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
