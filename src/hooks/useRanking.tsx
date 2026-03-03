import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RankedProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_energy: number;
  city: string | null;
  bio: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  rank_position: number;
}

export interface RankingStats {
  topEnergy: number;
  totalEnergy: number;
  totalParticipants: number;
}

export interface ProfileStats {
  triviaCorrect: number;
  triviaTotal: number;
  challengesCompleted: number;
}

const PAGE_SIZE = 50;

export function useRanking() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<RankedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RankingStats>({ topEnergy: 0, totalEnergy: 0, totalParticipants: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [myPosition, setMyPosition] = useState<{ rank: number; energy: number } | null>(null);
  const [jumpingToMe, setJumpingToMe] = useState(false);
  const myRowRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchPage = useCallback(async (page: number, search?: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_ranking_page', {
      p_page: page,
      p_page_size: PAGE_SIZE,
      p_search: search || null,
    });

    if (!error && data && data.length > 0) {
      setProfiles(data.map((d: any) => ({ ...d, rank_position: Number(d.rank_position) })));
      setTotalCount(Number(data[0].total_count));
    } else if (!error) {
      setProfiles([]);
      setTotalCount(0);
    }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.rpc('get_ranking_stats');
    if (data && data.length > 0) {
      setStats({
        topEnergy: data[0].top_energy,
        totalEnergy: Number(data[0].total_energy),
        totalParticipants: Number(data[0].total_participants),
      });
    }
  }, []);

  const fetchMyPosition = useCallback(async () => {
    if (!user) { setMyPosition(null); return; }
    const { data } = await supabase.rpc('get_my_rank_position', { p_user_id: user.id });
    if (data && data.length > 0) {
      setMyPosition({ rank: Number(data[0].rank_position), energy: data[0].total_energy });
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchPage(1);
    fetchStats();
  }, [fetchPage, fetchStats]);

  useEffect(() => {
    fetchMyPosition();
  }, [fetchMyPosition]);

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchPage(1, query);
    }, 400);
  }, [fetchPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchPage(page, searchQuery || undefined);
  }, [fetchPage, searchQuery]);

  const jumpToMyPosition = useCallback(async () => {
    if (!myPosition) return;
    setJumpingToMe(true);
    const targetPage = Math.ceil(myPosition.rank / PAGE_SIZE);
    
    // Clear search to show full ranking
    setSearchQuery('');
    setCurrentPage(targetPage);
    await fetchPage(targetPage);
    
    // Wait for render then scroll
    setTimeout(() => {
      myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setJumpingToMe(false);
    }, 300);
  }, [myPosition, fetchPage]);

  const fetchProfileStats = useCallback(async (userId: string): Promise<ProfileStats> => {
    const [{ data: triviaCompletions }, { data: submissions }] = await Promise.all([
      supabase.from('trivia_completions').select('is_correct').eq('user_id', userId),
      supabase.from('challenge_submissions').select('id').eq('user_id', userId).eq('status', 'approved'),
    ]);

    const triviaTotal = triviaCompletions?.length || 0;
    const triviaCorrect = triviaCompletions?.filter(t => t.is_correct).length || 0;

    return {
      triviaCorrect,
      triviaTotal,
      challengesCompleted: submissions?.length || 0,
    };
  }, []);

  return {
    profiles,
    loading,
    stats,
    currentPage,
    totalPages,
    totalCount,
    searchQuery,
    myPosition,
    jumpingToMe,
    myRowRef,
    user,
    handleSearch,
    goToPage,
    jumpToMyPosition,
    fetchProfileStats,
    PAGE_SIZE,
  };
}

export function formatEnergy(energy: number) {
  return energy.toLocaleString('es-ES');
}

export function formatTotalEnergy(energy: number) {
  if (energy >= 1000000) return (energy / 1000000).toFixed(1) + 'M';
  if (energy >= 1000) return (energy / 1000).toFixed(1) + 'K';
  return energy.toString();
}

export function getLevel(energy: number) {
  if (energy >= 10000) return "Elite";
  if (energy >= 5000) return "Pro";
  if (energy >= 1000) return "Avanzado";
  if (energy >= 100) return "Iniciado";
  return "Novato";
}
