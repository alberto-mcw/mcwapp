import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'daily' | 'weekly';
  energy_reward: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export interface ChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  energy_earned: number;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const [dailyChallenge, setDailyChallenge] = useState<Challenge | null>(null);
  const [weeklyChallenge, setWeeklyChallenge] = useState<Challenge | null>(null);
  const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch active challenges
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', today)
        .gte('ends_at', today);

      if (error) throw error;

      const daily = challenges?.find(c => c.challenge_type === 'daily') || null;
      const weekly = challenges?.find(c => c.challenge_type === 'weekly') || null;

      setDailyChallenge(daily as Challenge | null);
      setWeeklyChallenge(weekly as Challenge | null);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const fetchCompletions = async () => {
    if (!user) {
      setCompletions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('challenge_completions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setCompletions(data || []);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const completeChallenge = async (challengeId: string, energyReward: number) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('challenge_completions')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          energy_earned: energyReward
        });

      if (error) throw error;

      await fetchCompletions();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const isChallengeCompleted = (challengeId: string) => {
    return completions.some(c => c.challenge_id === challengeId);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchChallenges(), fetchCompletions()]);
      setLoading(false);
    };
    loadData();
  }, [user]);

  return {
    dailyChallenge,
    weeklyChallenge,
    completions,
    loading,
    completeChallenge,
    isChallengeCompleted,
    refetch: () => Promise.all([fetchChallenges(), fetchCompletions()])
  };
};
