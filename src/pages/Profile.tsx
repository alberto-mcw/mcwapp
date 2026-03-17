import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, Profile } from '@/hooks/useProfile';
import { useEnrollment } from '@/hooks/useEnrollment';
import { useProfile, Profile } from '@/hooks/useProfile';
import { usePresentationVideo } from '@/hooks/usePresentationVideo';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CHEF_AVATARS = [
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '🍷', label: 'Vino' },
  { emoji: '🥐', label: 'Croissant' },
  { emoji: '🍣', label: 'Sushi' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🍞', label: 'Pan' },
  { emoji: '🍾', label: 'Champán' },
  { emoji: '🍜', label: 'Ramen' },
  { emoji: '🦪', label: 'Ostra' },
  { emoji: '🍰', label: 'Tarta' },
  { emoji: '🔪', label: 'Cuchillo' },
  { emoji: '🍏', label: 'Manzana' },
  { emoji: '🌯', label: 'Burrito' },
  { emoji: '🍫', label: 'Chocolate' },
  { emoji: '🍔', label: 'Hamburguesa' },
  { emoji: '🧋', label: 'Bubble tea' },
  { emoji: '🍝', label: 'Pasta' },
  { emoji: '🍦', label: 'Helado' },
  { emoji: '🥘', label: 'Paella' },
  { emoji: '🍪', label: 'Galleta' },
];
import { 
  User, 
  MapPin, 
  Instagram, 
  Loader2, 
  Save,
  ArrowLeft,
  Video,
  Upload,
  Check,
  Clock
} from 'lucide-react';

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { video: presentationVideo, loading: videoLoading, uploadVideo } = usePresentationVideo();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    city: '',
    instagram_handle: '',
    tiktok_handle: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        city: profile.city || '',
        instagram_handle: profile.instagram_handle || '',
        tiktok_handle: profile.tiktok_handle || ''
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await updateProfile(formData);
    setIsSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive'
      });
    } else {
      toast({
        title: '¡Perfil actualizado!',
        description: 'Tus cambios se han guardado correctamente'
      });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Button>

          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <h1 className="font-unbounded text-2xl font-bold mb-6">Editar perfil</h1>

            {/* Presentation Video Section */}
            <div className="mb-8 border border-border rounded-xl p-4">
              <h3 className="font-unbounded font-bold mb-3 flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Vídeo de presentación
              </h3>
              {presentationVideo ? (
                <div className="space-y-3">
                  <video
                    src={presentationVideo.video_url}
                    controls
                    className="w-full rounded-lg max-h-64 bg-black"
                  />
                  <div className="flex items-center gap-2 text-sm">
                    {presentationVideo.status === 'approved' ? (
                      <span className="flex items-center gap-1 text-green-500">
                        <Check className="w-4 h-4" /> Aprobado · +100 puntos
                      </span>
                    ) : presentationVideo.status === 'rejected' ? (
                      <span className="text-destructive">No aprobado</span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Clock className="w-4 h-4" /> Pendiente de revisión
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Cuéntanos quién eres y tu conexión con la cocina y MasterChef. Gana +100 puntos al ser aprobado.
                  </p>
                  <input
                    ref={videoFileRef}
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 100 * 1024 * 1024) {
                        toast({ title: 'Máximo 100MB', variant: 'destructive' });
                        return;
                      }
                      setUploadingVideo(true);
                      const { error } = await uploadVideo(file);
                      setUploadingVideo(false);
                      if (error) {
                        toast({ title: 'Error al subir', variant: 'destructive' });
                      } else {
                        toast({ title: '🎬 ¡Vídeo enviado!', description: 'Un admin lo revisará' });
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    onClick={() => videoFileRef.current?.click()}
                    disabled={uploadingVideo}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingVideo ? 'Subiendo...' : 'Subir vídeo de presentación'}
                  </Button>
                </div>
              )}
            </div>

            {/* Avatar Section */}
            <div className="mb-8">
              <Label className="block mb-3">Tu avatar</Label>
              
              {/* Emoji avatars grid */}
              <div className="grid grid-cols-10 gap-1">
                {CHEF_AVATARS.map((avatar) => {
                  const isSelected = profile.avatar_url === avatar.emoji;
                  return (
                    <button
                      key={avatar.emoji}
                      type="button"
                      onClick={async () => {
                        await updateProfile({ avatar_url: avatar.emoji });
                        toast({
                          title: '¡Avatar actualizado!',
                          description: 'Tu avatar se ha cambiado'
                        });
                      }}
                      className={cn(
                        "aspect-square rounded-lg text-xl flex items-center justify-center transition-all border",
                        isSelected
                          ? "border-primary bg-primary/10 scale-105 shadow-lg"
                          : "border-border bg-background hover:border-primary/50 hover:bg-muted"
                      )}
                      title={avatar.label}
                    >
                      {avatar.emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="display_name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nombre de Chef
                </Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="Tu nombre de chef"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Cuéntanos sobre ti y tu pasión por la cocina..."
                  className="bg-background resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Ciudad
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Tu ciudad"
                  className="bg-background"
                />
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-unbounded font-bold mb-4">Redes Sociales</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram_handle" className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-primary" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram_handle"
                      name="instagram_handle"
                      value={formData.instagram_handle}
                      onChange={handleChange}
                      placeholder="@tu_usuario"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok_handle" className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                      TikTok
                    </Label>
                    <Input
                      id="tiktok_handle"
                      name="tiktok_handle"
                      value={formData.tiktok_handle}
                      onChange={handleChange}
                      placeholder="@tu_usuario"
                      className="bg-background"
                    />
                  </div>

                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full btn-fire font-unbounded"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
