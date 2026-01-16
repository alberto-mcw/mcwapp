import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Brain, Trophy, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyTrivia {
  id: string;
  scheduled_date: string;
  title: string;
  status: string;
  difficulty: string;
}

interface Challenge {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  challenge_type: string;
}

interface AdminCalendarProps {
  trivias: DailyTrivia[];
  challenges: Challenge[];
  onSelectDate: (date: Date, type: 'trivia' | 'challenge') => void;
  onEditTrivia: (trivia: DailyTrivia) => void;
  onEditChallenge: (challenge: Challenge) => void;
}

export const AdminCalendar = ({ 
  trivias, 
  challenges, 
  onSelectDate, 
  onEditTrivia, 
  onEditChallenge 
}: AdminCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'all' | 'trivias' | 'challenges'>('all');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Week starts on Monday (weekStartsOn: 1) so it ends on Sunday
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTriviaForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return trivias.find(t => t.scheduled_date === dateStr);
  };

  const getChallengesForDate = (date: Date) => {
    return challenges.filter(c => {
      const start = parseISO(c.starts_at);
      const end = parseISO(c.ends_at);
      return isWithinInterval(date, { start, end });
    });
  };

  const getStatusByDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr > today) return 'future';
    if (dateStr === today) return 'active';
    return 'past';
  };

  const getChallengeStatusForDay = (challenge: Challenge, day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNormalized = new Date(day);
    dayNormalized.setHours(0, 0, 0, 0);
    
    const start = parseISO(challenge.starts_at);
    const end = parseISO(challenge.ends_at);
    
    // Check if today is within the challenge range
    const isTodayInRange = isWithinInterval(today, { start, end });
    
    if (isTodayInRange && isSameDay(day, today)) return 'active';
    if (dayNormalized > today) return 'future';
    return 'past';
  };

  const today = new Date();

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-unbounded font-bold text-lg min-w-[200px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentMonth(new Date())}
            >
              Hoy
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('all')}
            >
              Todo
            </Button>
              <Button 
              variant={viewMode === 'trivias' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('trivias')}
              className="gap-1"
            >
              <Brain className="w-3 h-3" />
              Mini Retos
            </Button>
            <Button 
              variant={viewMode === 'challenges' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('challenges')}
              className="gap-1"
            >
              <Trophy className="w-3 h-3" />
              Desafíos
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Programado (futuro)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Activo (hoy)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
            <span className="text-muted-foreground">Pasado</span>
          </div>
        </div>

        {/* Week days header - Monday to Sunday */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div 
              key={day} 
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const trivia = getTriviaForDate(day);
            const dayChallenges = getChallengesForDate(day);
            const isToday = isSameDay(day, today);
            const showTrivia = viewMode === 'all' || viewMode === 'trivias';
            const showChallenges = viewMode === 'all' || viewMode === 'challenges';

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] p-1 border rounded-lg transition-colors",
                  isToday ? "border-primary bg-primary/5" : "border-border",
                  !isSameMonth(day, currentMonth) && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Quick add buttons */}
                  <div className="flex gap-0.5">
                    {showTrivia && !trivia && (
                                <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={() => onSelectDate(day, 'trivia')}
                        title="Añadir mini reto"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Trivia indicator */}
                  {showTrivia && trivia && (
                    <button
                      onClick={() => onEditTrivia(trivia)}
                      className={cn(
                        "w-full text-left text-xs p-1 rounded flex items-center gap-1 truncate transition-colors hover:opacity-80",
                        getStatusByDate(trivia.scheduled_date) === 'active' ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                        getStatusByDate(trivia.scheduled_date) === 'future' ? "bg-blue-500/20 text-blue-700 dark:text-blue-400" :
                        "bg-muted text-muted-foreground"
                      )}
                      title={trivia.title}
                    >
                      <Brain className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{trivia.title}</span>
                    </button>
                  )}

                  {/* Challenge indicators */}
                  {showChallenges && dayChallenges.slice(0, 2).map((challenge) => {
                    const isStart = isSameDay(parseISO(challenge.starts_at), day);
                    const isEnd = isSameDay(parseISO(challenge.ends_at), day);
                    
                    const challengeStatus = getChallengeStatusForDay(challenge, day);
                    
                    return (
                      <button
                        key={challenge.id}
                        onClick={() => onEditChallenge(challenge)}
                        className={cn(
                          "w-full text-left text-xs p-1 rounded flex items-center gap-1 truncate transition-colors hover:opacity-80",
                          challengeStatus === 'active' ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                          challengeStatus === 'future' ? "bg-blue-500/20 text-blue-700 dark:text-blue-400" :
                          "bg-muted text-muted-foreground"
                        )}
                        title={`${challenge.title} (${isStart ? 'Inicio' : isEnd ? 'Fin' : 'En curso'})`}
                      >
                        <Trophy className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{challenge.title}</span>
                        {isStart && <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0">Inicio</Badge>}
                        {isEnd && <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0">Fin</Badge>}
                      </button>
                    );
                  })}

                  {showChallenges && dayChallenges.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayChallenges.length - 2} más
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-6 pt-4 border-t border-border flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {trivias.filter(t => new Date(t.scheduled_date) >= new Date(new Date().toISOString().split('T')[0])).length} mini retos programados
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {challenges.filter(c => c.is_active).length} desafíos activos
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
