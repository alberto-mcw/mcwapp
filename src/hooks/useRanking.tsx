import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { rankingService, type RankedItem, type RankingStats, type CountryOption } from '@/services/RankingService';

export type { RankedItem, RankingStats, CountryOption };
export type { MyRankPosition } from '@/services/RankingService';

export interface ProfileStats {
  triviaCorrect: number;
  triviaTotal: number;
  challengesCompleted: number;
}

const PAGE_SIZE = 50;

export function useRanking() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RankingStats>({ topEnergy: 0, totalEnergy: 0, totalParticipants: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [myPosition, setMyPosition] = useState<{ rank: number; energy: number; country: string | null } | null>(null);
  const [jumpingToMe, setJumpingToMe] = useState(false);
  const [highlightUserId, setHighlightUserId] = useState<string | null>(null);
  const [pendingJumpUserId, setPendingJumpUserId] = useState<string | null>(null);

  const rowRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const setRowRef = useCallback((userId: string, el: HTMLDivElement | null) => {
    if (el) rowRefsMap.current.set(userId, el);
    else rowRefsMap.current.delete(userId);
  }, []);

  const fetchPage = useCallback(async (page: number, search?: string, country?: string | null) => {
    setLoading(true);
    try {
      const result = await rankingService.listRanking({
        page,
        pageSize: PAGE_SIZE,
        query: search || undefined,
        country,
      });
      setProfiles(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error('Error fetching ranking page:', err);
    }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async (country?: string | null) => {
    const s = await rankingService.getStats({ country });
    setStats(s);
  }, []);

  const fetchCountries = useCallback(async () => {
    const c = await rankingService.getCountries();
    setCountries(c);
  }, []);

  const fetchMyPosition = useCallback(async (country?: string | null) => {
    if (!user) { setMyPosition(null); return; }
    const pos = await rankingService.getMyRankPosition(user.id, { country });
    if (pos) {
      setMyPosition({ rank: pos.rankIndex, energy: pos.energy, country: pos.country });
    } else {
      setMyPosition(null);
    }
  }, [user]);

  // After profiles load, check if there's a pending jump
  useEffect(() => {
    if (!pendingJumpUserId || loading || profiles.length === 0) return;
    const timer = setTimeout(() => {
      const el = rowRefsMap.current.get(pendingJumpUserId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightUserId(pendingJumpUserId);
        setTimeout(() => setHighlightUserId(null), 4000);
      }
      setPendingJumpUserId(null);
      setJumpingToMe(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [pendingJumpUserId, loading, profiles]);

  useEffect(() => { fetchCountries(); }, [fetchCountries]);

  useEffect(() => {
    if (user && myPosition?.country && countryFilter === null) {
      setCountryFilter(myPosition.country);
    }
  }, [user, myPosition, countryFilter]);

  useEffect(() => {
    setCurrentPage(1);
    fetchPage(1, searchQuery || undefined, countryFilter);
    fetchStats(countryFilter);
    fetchMyPosition(countryFilter);
  }, [countryFilter, fetchPage, fetchStats, fetchMyPosition]); // eslint-disable-line

  useEffect(() => {
    if (user) fetchMyPosition(null);
  }, [user]); // eslint-disable-line

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
    if (!user) return;
    if (!myPosition) {
      toast.info('Aún no tienes posición en el ranking');
      return;
    }
    setJumpingToMe(true);
    try {
      const targetPage = Math.ceil(myPosition.rank / PAGE_SIZE);
      setSearchQuery('');
      setCurrentPage(targetPage);
      setPendingJumpUserId(user.id);
      await fetchPage(targetPage, undefined, countryFilter);
    } catch {
      toast.error('No hemos podido localizar tu posición. Reintenta.');
      setJumpingToMe(false);
      setPendingJumpUserId(null);
    }
  }, [user, myPosition, fetchPage, countryFilter]);

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
    highlightUserId,
    user,
    handleSearch,
    handleCountryChange,
    goToPage,
    jumpToMyPosition,
    setRowRef,
    PAGE_SIZE,
  };
}

// ── Display helpers ──

export function countryFlag(code: string | null) {
  if (!code || code.length !== 2) return '🌍';
  const offset = 0x1F1E6;
  return String.fromCodePoint(
    code.charCodeAt(0) - 65 + offset,
    code.charCodeAt(1) - 65 + offset
  );
}

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
  if (energy >= 10000) return 'Elite';
  if (energy >= 5000) return 'Pro';
  if (energy >= 1000) return 'Avanzado';
  if (energy >= 100) return 'Iniciado';
  return 'Novato';
}
