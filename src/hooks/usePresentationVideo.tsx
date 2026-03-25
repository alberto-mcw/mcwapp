import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PresentationVideo {
  id: string;
  user_id: string;
  video_url: string;
  status: string;
  energy_awarded: boolean;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const usePresentationVideo = () => {
  const { user } = useAuth();
  const [video, setVideo] = useState<PresentationVideo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVideo = async () => {
    if (!user) { setVideo(null); setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('presentation_videos')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setVideo(data);
    } catch (e) {
      console.error('Error fetching presentation video:', e);
    } finally {
      setLoading(false);
    }
  };

  const uploadVideo = async (file: File) => {
    if (!user) return { error: new Error('No user') };
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/presentation.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('challenge-videos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Store the path (not public URL) since bucket is private
      const storagePath = filePath;

      const { error: insertError } = await supabase
        .from('presentation_videos')
        .insert({ user_id: user.id, video_url: storagePath });
      if (insertError) throw insertError;

      await fetchVideo();
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  useEffect(() => { fetchVideo(); }, [user]);

  return { video, loading, uploadVideo, refetch: fetchVideo };
};
