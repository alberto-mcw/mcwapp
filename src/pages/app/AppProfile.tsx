import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { SectionTitle } from '@/components/app/SectionTitle';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  User, 
  MapPin, 
  Instagram, 
  Loader2, 
  Save,
  LogOut,
  Trophy,
  Shield,
  Zap,
  ChefHat,
  Settings,
  ChevronRight
} from 'lucide-react';

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

const AppProfile = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    city: '',
    instagram_handle: '',
    tiktok_handle: ''
  });
  const [isSaving, setIsSaving] = useState(false);

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
      setShowEditForm(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/app/auth');
  };

  if (profileLoading) {
    return (
      <MobileAppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileAppLayout>
    );
  }

  const isEmojiAvatar = profile?.avatar_url && CHEF_AVATARS.some(a => a.emoji === profile.avatar_url);

  return (
    <MobileAppLayout>
      <AppHeader
        rightAction={
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className="text-primary text-sm font-medium"
          >
            {showEditForm ? 'Cancelar' : 'Editar'}
          </button>
        }
      />
      <SectionTitle title="Perfil" />

      <div className="px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {isEmojiAvatar ? (
                <span className="text-4xl">{profile?.avatar_url}</span>
              ) : profile?.avatar_url?.startsWith('http') ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <ChefHat className="w-8 h-8 text-primary" />
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="font-unbounded text-lg font-bold">
                {profile?.display_name || 'Chef'}
              </h2>
              {profile?.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.city}
                </p>
              )}
            </div>
          </div>

          {/* Energy Stats */}
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Energía total</p>
              <p className="text-xl font-black text-primary tabular-nums">
                {profile?.total_energy?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {showEditForm && (
          <div className="bg-card border border-border rounded-2xl p-4">
            {/* Avatar Selection */}
            <div className="mb-4">
              <Label className="block mb-2 text-sm">Tu avatar</Label>
              <div className="grid grid-cols-10 gap-1">
                {CHEF_AVATARS.map((avatar) => {
                  const isSelected = profile?.avatar_url === avatar.emoji;
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
                        "aspect-square rounded-lg text-lg flex items-center justify-center transition-all border",
                        isSelected
                          ? "border-primary bg-primary/10 scale-105"
                          : "border-border bg-background"
                      )}
                    >
                      {avatar.emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="display_name" className="text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Nombre de Chef
                </Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="Tu nombre de chef"
                  className="bg-background h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-sm">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Cuéntanos sobre ti..."
                  className="bg-background resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Ciudad
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Tu ciudad"
                  className="bg-background h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="instagram_handle" className="text-sm flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-primary" />
                  Instagram
                </Label>
                <Input
                  id="instagram_handle"
                  name="instagram_handle"
                  value={formData.instagram_handle}
                  onChange={handleChange}
                  placeholder="@tu_usuario"
                  className="bg-background h-9"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full btn-primary"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar cambios
              </Button>
            </form>
          </div>
        )}

        {/* Actions */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <Link 
            to="/app/ranking"
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-sm">Ver Ranking</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          
          {isAdmin && (
            <Link 
              to="/admin"
              className="flex items-center justify-between p-4 border-t border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">Panel Admin</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 border-t border-border hover:bg-destructive/10 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="font-medium text-sm text-destructive">Cerrar sesión</span>
            </div>
          </button>
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default AppProfile;
