import { Link } from 'react-router-dom';
import { Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { User, Camera, Loader2, Settings } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProfileCardProps {
  profile: Profile;
  onAvatarUpload: (file: File) => Promise<{ error: Error | null; url: string | null }>;
}

export const ProfileCard = ({ profile, onAvatarUpload }: ProfileCardProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Archivo demasiado grande',
        description: 'La imagen debe ser menor a 2MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    const { error } = await onAvatarUpload(file);
    setIsUploading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen',
        variant: 'destructive'
      });
    } else {
      toast({
        title: '¡Foto actualizada!',
        description: 'Tu foto de perfil se ha actualizado'
      });
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative group mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-primary/30 ring-4 ring-primary/10">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Name & Email */}
        <h3 className="font-unbounded font-bold text-lg">
          {profile.display_name || 'Chef Anónimo'}
        </h3>
        <p className="text-sm text-muted-foreground mb-1">{profile.email}</p>
        
        {/* Location */}
        {profile.city && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            📍 {profile.city}
          </p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {profile.bio}
          </p>
        )}

        {/* Edit Button */}
        <Button asChild variant="outline" size="sm" className="mt-4 w-full gap-2">
          <Link to="/profile">
            <Settings className="w-4 h-4" />
            Editar Perfil
          </Link>
        </Button>
      </div>
    </div>
  );
};
