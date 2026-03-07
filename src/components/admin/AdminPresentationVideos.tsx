import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PresentationVideoAdmin {
  id: string;
  user_id: string;
  video_url: string;
  status: string;
  energy_awarded: boolean;
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export const AdminPresentationVideos = () => {
  const [videos, setVideos] = useState<PresentationVideoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVideos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('presentation_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (v: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email, avatar_url')
            .eq('user_id', v.user_id)
            .maybeSingle();
          return { ...v, profile };
        })
      );
      setVideos(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleApprove = async (video: PresentationVideoAdmin) => {
    const { error } = await supabase
      .from('presentation_videos')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', video.id);
    
    if (error) {
      toast({ title: 'Error al aprobar', variant: 'destructive' });
    } else {
      toast({ title: '✅ Vídeo aprobado', description: '+100 puntos otorgados' });
      fetchVideos();
    }
  };

  const handleReject = async (video: PresentationVideoAdmin) => {
    const { error } = await supabase
      .from('presentation_videos')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', video.id);
    
    if (error) {
      toast({ title: 'Error al rechazar', variant: 'destructive' });
    } else {
      toast({ title: 'Vídeo rechazado' });
      fetchVideos();
    }
  };

  const handleRevoke = async (video: PresentationVideoAdmin) => {
    const { error } = await supabase
      .from('presentation_videos')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', video.id);
    
    if (error) {
      toast({ title: 'Error al revocar', variant: 'destructive' });
    } else {
      toast({ title: 'Aprobación revocada', description: '-100 energía' });
      fetchVideos();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const pending = videos.filter(v => v.status === 'pending');
  const reviewed = videos.filter(v => v.status !== 'pending');

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="font-unbounded font-bold mb-3">Pendientes ({pending.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map(video => (
              <Card key={video.id} className="overflow-hidden">
                <video src={video.video_url} controls className="w-full aspect-video bg-black" />
                <CardContent className="p-3 space-y-2">
                  <p className="font-semibold text-sm">{video.profile?.display_name || 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground">{video.profile?.email}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(video)} className="flex-1 gap-1">
                      <Check className="w-3 h-3" /> Aprobar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(video)} className="flex-1 gap-1">
                      <X className="w-3 h-3" /> Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h3 className="font-unbounded font-bold mb-3">Revisados ({reviewed.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviewed.map(video => (
              <Card key={video.id} className="overflow-hidden">
                <video src={video.video_url} controls className="w-full aspect-video bg-black" />
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{video.profile?.display_name || 'Sin nombre'}</p>
                    <Badge variant={video.status === 'approved' ? 'default' : 'destructive'}>
                      {video.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{video.profile?.email}</p>
                  {video.status === 'approved' && (
                    <Button size="sm" variant="outline" onClick={() => handleRevoke(video)} className="w-full text-xs">
                      Revocar aprobación (-100 pts)
                    </Button>
                  )}
                  {video.status === 'rejected' && (
                    <Button size="sm" onClick={() => handleApprove(video)} className="w-full text-xs gap-1">
                      <Check className="w-3 h-3" /> Aprobar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {videos.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No hay vídeos de presentación aún</p>
      )}
    </div>
  );
};
