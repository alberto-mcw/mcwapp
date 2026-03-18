import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { useEnrollment } from '@/hooks/useEnrollment';
import { EnrollmentBadge } from '@/components/enrollment/EnrollmentBadge';
import { EnrollmentForm } from '@/components/enrollment/EnrollmentForm';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  MapPin, Loader2, Save, LogOut, Trophy, Shield,
  Zap, ChefHat, ChevronRight, Flame, Settings, ArrowLeft
} from 'lucide-react';

const CHEF_AVATARS = [
  { emoji: '🍕', label: 'Pizza' }, { emoji: '🍷', label: 'Vino' }, { emoji: '🥐', label: 'Croissant' },
  { emoji: '🍣', label: 'Sushi' }, { emoji: '☕', label: 'Café' }, { emoji: '🍞', label: 'Pan' },
  { emoji: '🍾', label: 'Champán' }, { emoji: '🍜', label: 'Ramen' }, { emoji: '🦪', label: 'Ostra' },
  { emoji: '🍰', label: 'Tarta' }, { emoji: '🔪', label: 'Cuchillo' }, { emoji: '🍏', label: 'Manzana' },
  { emoji: '🌯', label: 'Burrito' }, { emoji: '🍫', label: 'Chocolate' }, { emoji: '🍔', label: 'Hamburguesa' },
  { emoji: '🧋', label: 'Bubble tea' }, { emoji: '🍝', label: 'Pasta' }, { emoji: '🍦', label: 'Helado' },
  { emoji: '🥘', label: 'Paella' }, { emoji: '🍪', label: 'Galleta' },
];

const AppProfile = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { isAdmin } = useAdmin();
  const { isEnrolled, loading: enrollLoading, enroll } = useEnrollment();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await updateProfile(formData);
    setIsSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios', variant: 'destructive' });
    } else {
      toast({ title: '¡Perfil actualizado!', description: 'Tus cambios se han guardado correctamente' });
      setShowEditForm(false);
    }
  };

  const handleEnroll = async (data: Parameters<typeof enroll>[0]) => {
    setEnrollSubmitting(true);
    const result = await enroll(data);
    setEnrollSubmitting(false);
    if (result.error) {
      toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
    } else {
      toast({ title: '¡Inscripción completada!', description: 'Ya estás dentro de El Reto 2026' });
      setShowEnrollForm(false);
    }
    return result;
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/app/auth');
  };

  // Guest state — show prompt with nav intact
  if (!user && !profileLoading) {
    return (
      <MobileAppLayout>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center gap-5 min-h-[70vh]">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ChefHat className="w-10 h-10 text-white/20" />
          </div>
          <div className="space-y-2">
            <h2 className="app-section-title">Tu perfil de chef</h2>
            <p className="app-body-sm max-w-xs">
              Inicia sesión para ver tu perfil, tus puntos y participar en El Reto 2026.
            </p>
          </div>
          <Link to="/app/auth" className="btn-primary w-full max-w-xs">
            Iniciar sesión
          </Link>
        </div>
      </MobileAppLayout>
    );
  }

  if (profileLoading || enrollLoading) {
    return (
      <MobileAppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileAppLayout>
    );
  }

  const isEmojiAvatar = profile?.avatar_url && CHEF_AVATARS.some(a => a.emoji === profile.avatar_url);

  // Settings view
  if (showEditForm) {
    return (
      <MobileAppLayout>
        <AppHeader
          rightAction={
            <button onClick={() => setShowEditForm(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
          }
        />
        <div className="px-4 py-6 space-y-0">
          <h2 className="app-section-title text-left mb-5">Ajustes de perfil</h2>

          {/* Avatar Selection */}
          <div className="mb-5">
            <label className="app-input-label">Tu avatar</label>
            <div className="grid grid-cols-10 gap-1.5 mt-2">
              {CHEF_AVATARS.map((avatar) => (
                <button
                  key={avatar.emoji}
                  type="button"
                  onClick={async () => {
                    await updateProfile({ avatar_url: avatar.emoji });
                    toast({ title: '¡Avatar actualizado!' });
                  }}
                  className={cn(
                    "aspect-square rounded-xl text-lg flex items-center justify-center transition-all",
                    profile?.avatar_url === avatar.emoji
                      ? "bg-primary/15 ring-2 ring-primary scale-110"
                      : "bg-background hover:bg-muted"
                  )}
                >{avatar.emoji}</button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-0">
            <div className="py-3">
              <label className="app-input-label">Nombre de Chef</label>
              <input name="display_name" value={formData.display_name} onChange={handleChange} placeholder="Tu nombre de chef" className="app-input" />
            </div>
            <div className="py-3">
              <label className="app-input-label">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Cuéntanos sobre ti..." className="app-input resize-none" rows={2} />
            </div>
            <div className="py-3">
              <label className="app-input-label">Ciudad</label>
              <input name="city" value={formData.city} onChange={handleChange} placeholder="Tu ciudad" className="app-input" />
            </div>
            <div className="py-3">
              <label className="app-input-label">Instagram</label>
              <input name="instagram_handle" value={formData.instagram_handle} onChange={handleChange} placeholder="@tu_usuario" className="app-input" />
            </div>
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className={cn("btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2", isSaving && "opacity-70")}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <AppHeader />

      {/* Profile Hero */}
      <div className="px-4 pt-4 pb-6">
        <div className="flex flex-col items-center text-center relative">
          {/* Settings icon */}
          <button
            onClick={() => setShowEditForm(true)}
            className="absolute top-0 right-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="w-20 h-20 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center mb-3 glow-soft">
            {isEmojiAvatar ? (
              <span className="text-4xl">{profile?.avatar_url}</span>
            ) : profile?.avatar_url?.startsWith('http') ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <ChefHat className="w-10 h-10 text-primary" />
            )}
          </div>
          <h1 className="app-title">
            {profile?.display_name || 'Chef'}
          </h1>
          {profile?.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
              <MapPin className="w-3.5 h-3.5" />{profile.city}
            </p>
          )}

          {profile?.auth_provider && profile.auth_provider !== 'email' && (
            <div className="mt-3">
              <span className="app-caption px-2.5 py-1 rounded-full bg-white/5 border border-white/10 capitalize">
                {profile.auth_provider === 'google' ? 'Google' : 'Apple'}
              </span>
            </div>
          )}

          {/* Energy pill */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5 mt-3">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary tabular-nums">
              {profile?.total_energy?.toLocaleString() || 0} puntos
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Enrollment Badge or CTA */}
        {isEnrolled ? (
          <EnrollmentBadge />
        ) : (
          !showEnrollForm && (
            <button
              onClick={() => setShowEnrollForm(true)}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Inscríbete en El Reto 2026</p>
                  <p className="text-xs text-muted-foreground">Completa tus datos para participar</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          )
        )}

        {/* Enrollment Form */}
        {showEnrollForm && !isEnrolled && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="app-heading mb-3">Inscripción a El Reto 2026</h3>
            <EnrollmentForm
              userCountry={profile?.country}
              onSubmit={handleEnroll}
              onCancel={() => setShowEnrollForm(false)}
              isSubmitting={enrollSubmitting}
            />
          </div>
        )}

        {/* Actions */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <Link to="/app/ranking" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm text-foreground">Ver Ranking</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="flex items-center justify-between p-4 border-t border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm text-foreground">Panel Admin</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
          
          <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 border-t border-border hover:bg-destructive/10 transition-colors text-left">
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
