import { supabase } from '@/integrations/supabase/client';

// ── Types ──

export interface ListRankingParams {
  page: number;
  pageSize: number;
  query?: string;
  country?: string | null;
}

export interface RankedItem {
  id: string;
  userId: string;
  alias: string | null;
  avatarUrl: string | null;
  energy: number;
  level: string;
  city: string | null;
  country: string | null;
  bio: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  rankIndex: number;
}

export interface ListRankingResult {
  items: RankedItem[];
  totalCount: number;
}

export interface MyRankPosition {
  rankIndex: number;
  energy: number;
  country: string | null;
}

export interface RankingStats {
  topEnergy: number;
  totalEnergy: number;
  totalParticipants: number;
}

export interface CountryOption {
  country: string;
  userCount: number;
}

// ── Interface ──

export interface RankingService {
  listRanking(params: ListRankingParams): Promise<ListRankingResult>;
  getMyRankPosition(userId: string, opts?: { country?: string | null }): Promise<MyRankPosition | null>;
  getStats(opts?: { country?: string | null }): Promise<RankingStats>;
  getCountries(): Promise<CountryOption[]>;
}

// ── Helpers ──

function getLevel(energy: number): string {
  if (energy >= 10000) return 'Elite';
  if (energy >= 5000) return 'Pro';
  if (energy >= 1000) return 'Avanzado';
  if (energy >= 100) return 'Iniciado';
  return 'Novato';
}

function mapRow(d: any): RankedItem {
  return {
    id: d.id,
    userId: d.user_id,
    alias: d.display_name,
    avatarUrl: d.avatar_url,
    energy: d.total_energy,
    level: getLevel(d.total_energy),
    city: d.city,
    country: d.country,
    bio: d.bio,
    instagramHandle: d.instagram_handle,
    tiktokHandle: d.tiktok_handle,
    rankIndex: Number(d.rank_position),
  };
}

// ── Supabase implementation ──

export const rankingService: RankingService = {
  async listRanking({ page, pageSize, query, country }): Promise<ListRankingResult> {
    const { data, error } = await supabase.rpc('get_ranking_page', {
      p_page: page,
      p_page_size: pageSize,
      p_search: query || null,
      p_country: country ?? null,
    });

    if (error) throw error;

    if (data && data.length > 0) {
      return {
        items: data.map(mapRow),
        totalCount: Number(data[0].total_count),
      };
    }
    return { items: [], totalCount: 0 };
  },

  async getMyRankPosition(userId, opts): Promise<MyRankPosition | null> {
    const { data, error } = await supabase.rpc('get_my_rank_position', {
      p_user_id: userId,
      p_country: opts?.country ?? null,
    });

    if (error) return null;

    if (data && data.length > 0 && Number(data[0].rank_position) > 0) {
      return {
        rankIndex: Number(data[0].rank_position),
        energy: data[0].total_energy,
        country: data[0].country,
      };
    }
    return null;
  },

  async getStats(opts): Promise<RankingStats> {
    const { data } = await supabase.rpc('get_ranking_stats', { p_country: opts?.country ?? null });
    if (data && data.length > 0) {
      return {
        topEnergy: data[0].top_energy,
        totalEnergy: Number(data[0].total_energy),
        totalParticipants: Number(data[0].total_participants),
      };
    }
    return { topEnergy: 0, totalEnergy: 0, totalParticipants: 0 };
  },

  async getCountries(): Promise<CountryOption[]> {
    const { data } = await supabase.rpc('get_ranking_countries');
    return (data || []).map((c: any) => ({ country: c.country, userCount: c.user_count }));
  },
};
