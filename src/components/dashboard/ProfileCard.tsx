import { Link } from 'react-router-dom';
import { Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { User, Settings } from 'lucide-react';

const EMOJI_AVATARS = ['🍕', '🍷', '🥐', '🍣', '☕', '🍞', '🍾', '🍜', '🦪', '🍰', '🔪', '🍏', '🌯', '🍫', '🍔', '🧋', '🍝', '🍦', '🥘', '🍪'];

interface ProfileCardProps {
  profile: Profile;
  onAvatarUpload?: (file: File) => Promise<{ error: Error | null; url: string | null }>;
}

export const ProfileCard = ({ profile }: ProfileCardProps) => {
  const isEmojiAvatar = profile.avatar_url && EMOJI_AVATARS.includes(profile.avatar_url);

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative group mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted glow-border ring-4 ring-primary/10 flex items-center justify-center">
            {profile.avatar_url ? (
              isEmojiAvatar ? (
                <span className="text-4xl">{profile.avatar_url}</span>
              ) : (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
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
            Editar perfil
          </Link>
        </Button>
      </div>
    </div>
  );
};
