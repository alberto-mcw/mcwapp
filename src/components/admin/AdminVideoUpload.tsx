import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Link2, Search, UserPlus, Trash2, ExternalLink, Video } from 'lucide-react';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Challenge {
  id: string;
  title: string;
  challenge_type: string;
  is_active: boolean;
}

interface UploadedVideo {
  id: string;
  video_url: string;
  dish_name: string | null;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
  challenge_id: string;
  profile?: Profile | null;
  challenge?: { title: string } | null;
}

// Detect embed URL from social platforms
const getEmbedInfo = (url: string): { platform: string; embedUrl: string | null; originalUrl: string } => {
  const trimmed = url.trim();
  
  // Instagram Reel/Post
  const igMatch = trimmed.match(/instagram\.com\/(reel|p)\/([\w-]+)/);
  if (igMatch) {
    return {
      platform: 'Instagram',
      embedUrl: `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed`,
      originalUrl: trimmed,
    };
  }

  // TikTok
  const ttMatch = trimmed.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  if (ttMatch) {
    return {
      platform: 'TikTok',
      embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
      originalUrl: trimmed,
    };
  }

  // YouTube Shorts or regular
  const ytShortMatch = trimmed.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (ytShortMatch) {
    return {
      platform: 'YouTube Shorts',
      embedUrl: `https://www.youtube.com/embed/${ytShortMatch[1]}`,
      originalUrl: trimmed,
    };
  }
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) {
    return {
      platform: 'YouTube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      originalUrl: trimmed,
    };
  }

  // Direct video URL
  if (trimmed.match(/\.(mp4|webm|mov)(\?|$)/i)) {
    return { platform: 'Direct', embedUrl: null, originalUrl: trimmed };
  }

  return { platform: 'URL', embedUrl: null, originalUrl: trimmed };
};

export const AdminVideoUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);

  // Form state
  const [videoUrl, setVideoUrl] = useState('');
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');

  // Lookups
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);

  useEffect(() => {
    fetchChallenges();
    fetchUploadedVideos();
  }, []);

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from('challenges')
      .select('id, title, challenge_type, is_active')
      .order('created_at', { ascending: false });
    setChallenges(data || []);
  };

  const fetchUploadedVideos = async () => {
    setLoadingVideos(true);
    // Fetch submissions that were created by admin (we'll tag them with description containing [ADMIN])
    const { data } = await supabase
      .from('challenge_submissions')
      .select('id, video_url, dish_name, description, status, created_at, user_id, challenge_id')
      .order('created_at', { ascending: false });

    if (data) {
      // Enrich with profiles and challenges
      const userIds = [...new Set(data.map(d => d.user_id))];
      const challengeIds = [...new Set(data.map(d => d.challenge_id))];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', userIds);

      const { data: challengesData } = await supabase
        .from('challenges')
        .select('id, title')
        .in('id', challengeIds);

      // Filter only admin-uploaded ones (tagged with [ADMIN-UPLOAD])
      const adminVideos = data
        .filter(v => v.description?.includes('[ADMIN-UPLOAD]'))
        .map(v => ({
          ...v,
          profile: profilesData?.find(p => p.user_id === v.user_id) || null,
          challenge: challengesData?.find(c => c.id === v.challenge_id) || null,
        }));
      
      setUploadedVideos(adminVideos);
    }
    setLoadingVideos(false);
  };

  const searchProfiles = async (query: string) => {
    setProfileSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, avatar_url')
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    
    setSearchResults(data || []);
  };

  const handleSubmit = async () => {
    if (!videoUrl.trim()) {
      toast({ title: 'Introduce una URL de vídeo', variant: 'destructive' });
      return;
    }
    if (!selectedChallengeId) {
      toast({ title: 'Selecciona un desafío', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const assignUserId = selectedUserId || user!.id;
      const taggedDescription = `[ADMIN-UPLOAD] ${description}`.trim();

      const { error } = await supabase
        .from('challenge_submissions')
        .insert({
          video_url: videoUrl.trim(),
          dish_name: dishName || null,
          description: taggedDescription,
          user_id: assignUserId,
          challenge_id: selectedChallengeId,
          status: 'approved', // Admin-uploaded = auto-approved
          reel_url: videoUrl.trim(),
        });

      if (error) throw error;

      toast({ title: '✅ Vídeo cargado correctamente', description: 'Aparecerá en la galería al instante' });
      resetForm();
      setIsDialogOpen(false);
      fetchUploadedVideos();
    } catch (e: any) {
      console.error('Error uploading video:', e);
      toast({ title: 'Error al cargar vídeo', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('challenge_submissions')
      .delete()
      .eq('id', id);
    
    if (!error) {
      toast({ title: 'Vídeo eliminado' });
      fetchUploadedVideos();
    } else {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setVideoUrl('');
    setDishName('');
    setDescription('');
    setSelectedUserId('');
    setSelectedChallengeId('');
    setProfileSearch('');
    setSearchResults([]);
  };

  const embedInfo = videoUrl ? getEmbedInfo(videoUrl) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-unbounded font-bold text-lg">Carga externa de vídeos</h3>
          <p className="text-sm text-muted-foreground">
            Añade vídeos de Instagram, TikTok, YouTube o URL directa a la galería
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Cargar vídeo
        </Button>
      </div>

      {/* Uploaded videos list */}
      {loadingVideos ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : uploadedVideos.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay vídeos cargados externamente aún</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploadedVideos.map(video => {
            const info = getEmbedInfo(video.video_url);
            return (
              <Card key={video.id} className="overflow-hidden">
                <div className="aspect-video bg-black relative">
                  {info.platform === 'Direct' || info.platform === 'URL' ? (
                    <video src={video.video_url} controls className="w-full h-full object-contain" />
                  ) : info.embedUrl ? (
                    <iframe src={info.embedUrl} className="w-full h-full" allowFullScreen />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Video className="w-8 h-8" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2" variant="secondary">{info.platform}</Badge>
                </div>
                <CardContent className="p-3 space-y-2">
                  <p className="font-semibold text-sm truncate">{video.dish_name || 'Sin nombre'}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{video.profile?.display_name || 'Admin'}</span>
                    <span>{video.challenge?.title || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={video.status === 'approved' ? 'default' : 'secondary'}>
                      {video.status === 'approved' ? 'Publicado' : video.status}
                    </Badge>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" asChild className="h-7 w-7">
                        <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(video.id)} className="h-7 w-7 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-unbounded">Cargar vídeo externo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL */}
            <div className="space-y-2">
              <Label>URL del vídeo *</Label>
              <div className="flex gap-2">
                <Link2 className="w-4 h-4 mt-3 text-muted-foreground flex-shrink-0" />
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/... o URL directa .mp4"
                />
              </div>
              {embedInfo && videoUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">{embedInfo.platform}</Badge>
                  {embedInfo.platform === 'Instagram' && (
                    <span className="text-green-500">✓ Se mostrará como embed de Instagram</span>
                  )}
                  {embedInfo.platform === 'TikTok' && (
                    <span className="text-green-500">✓ Se mostrará como embed de TikTok</span>
                  )}
                  {embedInfo.platform === 'YouTube' || embedInfo.platform === 'YouTube Shorts' ? (
                    <span className="text-green-500">✓ Se mostrará como embed de YouTube</span>
                  ) : null}
                  {embedInfo.platform === 'Direct' && (
                    <span className="text-green-500">✓ Vídeo directo detectado</span>
                  )}
                </div>
              )}
              {/* Preview */}
              {embedInfo && videoUrl && (
                <div className="rounded-lg overflow-hidden bg-black aspect-video mt-2">
                  {embedInfo.platform === 'Direct' ? (
                    <video src={videoUrl} controls className="w-full h-full object-contain" />
                  ) : embedInfo.embedUrl ? (
                    <iframe src={embedInfo.embedUrl} className="w-full h-full" allowFullScreen />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      Vista previa no disponible para esta URL
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dish name */}
            <div className="space-y-2">
              <Label>Nombre del plato</Label>
              <Input
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="Ej: Paella valenciana"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve del vídeo..."
                rows={2}
              />
            </div>

            {/* Challenge selection */}
            <div className="space-y-2">
              <Label>Desafío asociado *</Label>
              <Select value={selectedChallengeId} onValueChange={setSelectedChallengeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un desafío" />
                </SelectTrigger>
                <SelectContent>
                  {challenges.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} {c.is_active ? '(activo)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User search (optional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Asociar a usuario (opcional)
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  value={profileSearch}
                  onChange={(e) => searchProfiles(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="pl-9"
                />
              </div>
              {selectedUserId && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-sm">
                  <span>✓ {searchResults.find(p => p.user_id === selectedUserId)?.display_name || profiles.find(p => p.user_id === selectedUserId)?.display_name || selectedUserId}</span>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedUserId('')} className="h-6 px-2 text-xs">
                    Quitar
                  </Button>
                </div>
              )}
              {searchResults.length > 0 && !selectedUserId && (
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map(profile => (
                    <button
                      key={profile.user_id}
                      onClick={() => { setSelectedUserId(profile.user_id); setSearchResults([]); }}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex items-center gap-2 border-b last:border-0"
                    >
                      <span className="font-medium">{profile.display_name || 'Sin nombre'}</span>
                      <span className="text-muted-foreground text-xs">{profile.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {!selectedUserId && (
                <p className="text-xs text-muted-foreground">Si no seleccionas usuario, se asignará a tu cuenta de admin</p>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Cargando...' : 'Publicar vídeo en galería'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
