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
  country: string | null;
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

export interface CountryOption {
  country: string;
  user_count: number;
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
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [myPosition, setMyPosition] = useState<{ rank: number; energy: number; country: string | null } | null>(null);
  const [jumpingToMe, setJumpingToMe] = useState(false);
  const myRowRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchPage = useCallback(async (page: number, search?: string, country?: string | null) => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_ranking_page', {
      p_page: page,
      p_page_size: PAGE_SIZE,
      p_search: search || null,
      p_country: country ?? null,
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

  const fetchStats = useCallback(async (country?: string | null) => {
    const { data } = await supabase.rpc('get_ranking_stats', { p_country: country ?? null });
    if (data && data.length > 0) {
      setStats({
        topEnergy: data[0].top_energy,
        totalEnergy: Number(data[0].total_energy),
        totalParticipants: Number(data[0].total_participants),
      });
    }
  }, []);

  const fetchCountries = useCallback(async () => {
    const { data } = await supabase.rpc('get_ranking_countries');
    if (data) setCountries(data);
  }, []);

  const fetchMyPosition = useCallback(async (country?: string | null) => {
    if (!user) { setMyPosition(null); return; }
    const { data } = await supabase.rpc('get_my_rank_position', { 
      p_user_id: user.id,
      p_country: country ?? null,
    });
    if (data && data.length > 0) {
      setMyPosition({ rank: Number(data[0].rank_position), energy: data[0].total_energy, country: data[0].country });
    } else {
      setMyPosition(null);
    }
  }, [user]);

  // Initial load — detect user's country, default filter to it
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Set user's country as default filter when we know it
  useEffect(() => {
    if (user && myPosition?.country && countryFilter === null) {
      // Only auto-set if the user has a country
      setCountryFilter(myPosition.country);
    }
  }, [user, myPosition, countryFilter]);

  // Fetch data when country filter changes
  useEffect(() => {
    setCurrentPage(1);
    fetchPage(1, searchQuery || undefined, countryFilter);
    fetchStats(countryFilter);
    fetchMyPosition(countryFilter);
  }, [countryFilter, fetchPage, fetchStats, fetchMyPosition]); // eslint-disable-line

  // Initial fetch of my position (without country filter to detect country)
  useEffect(() => {
    if (user) {
      fetchMyPosition(null);
    }
  }, [user]); // eslint-disable-line

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchPage(1, query, countryFilter);
    }, 400);
  }, [fetchPage, countryFilter]);

  const handleCountryChange = useCallback((country: string | null) => {
    setCountryFilter(country);
    setSearchQuery('');
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchPage(page, searchQuery || undefined, countryFilter);
  }, [fetchPage, searchQuery, countryFilter]);

  const jumpToMyPosition = useCallback(async () => {
    if (!myPosition) return;
    setJumpingToMe(true);
    const targetPage = Math.ceil(myPosition.rank / PAGE_SIZE);
    
    setSearchQuery('');
    setCurrentPage(targetPage);
    await fetchPage(targetPage, undefined, countryFilter);
    
    setTimeout(() => {
      myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setJumpingToMe(false);
    }, 300);
  }, [myPosition, fetchPage, countryFilter]);

  return {
    profiles,
    loading,
    stats,
    currentPage,
    totalPages,
    totalCount,
    searchQuery,
    countryFilter,
    countries,
    myPosition,
    jumpingToMe,
    myRowRef,
    user,
    handleSearch,
    handleCountryChange,
    goToPage,
    jumpToMyPosition,
    PAGE_SIZE,
  };
}

// Country code → flag emoji
export function countryFlag(code: string | null) {
  if (!code || code.length !== 2) return '🌍';
  const offset = 0x1F1E6;
  return String.fromCodePoint(
    code.charCodeAt(0) - 65 + offset,
    code.charCodeAt(1) - 65 + offset
  );
}

// Country code → name (common ones)
const COUNTRY_NAMES: Record<string, string> = {
  ES: 'España', MX: 'México', AR: 'Argentina', CO: 'Colombia', CL: 'Chile',
  PE: 'Perú', EC: 'Ecuador', VE: 'Venezuela', UY: 'Uruguay', BO: 'Bolivia',
  PY: 'Paraguay', CR: 'Costa Rica', PA: 'Panamá', DO: 'Rep. Dominicana',
  GT: 'Guatemala', HN: 'Honduras', SV: 'El Salvador', NI: 'Nicaragua',
  CU: 'Cuba', PR: 'Puerto Rico', US: 'Estados Unidos', BR: 'Brasil',
  PT: 'Portugal', FR: 'Francia', IT: 'Italia', DE: 'Alemania', GB: 'Reino Unido',
};

export function countryName(code: string | null) {
  if (!code) return 'Sin país';
  return COUNTRY_NAMES[code.toUpperCase()] || code;
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
