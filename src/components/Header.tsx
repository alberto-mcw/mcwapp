import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MasterChefLogo } from "./MasterChefLogo";
import { Menu, X, Download, User, LogIn, Shield, ChefHat, BookOpen, Flame, Settings, KeyRound, LogOut, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useProfile } from "@/hooks/useProfile";
import { useEnrollment } from "@/hooks/useEnrollment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EMOJI_AVATARS = ['🍕', '🍷', '🥐', '🍣', '☕', '🍞', '🍾', '🍜', '🦪', '🍰', '🔪', '🍏', '🌯', '🍫', '🍔', '🧋', '🍝', '🍦', '🥘', '🍪'];

const navItems = [
  { label: "Ranking", href: "/ranking" },
  { label: "Vídeos", href: "/videos" },
  { label: "Recetario", href: "/recetario" },
  { label: "FAQ", href: "/#faq" },
  { label: "Descargar App", href: "/descarga" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { profile } = useProfile();
  const { isEnrolled } = useEnrollment();

  const avatarUrl = profile?.avatar_url;
  const isEmoji = avatarUrl && EMOJI_AVATARS.includes(avatarUrl);
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Chef';

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast.error('Error al enviar el email de recuperación');
    } else {
      toast.success('Te hemos enviado un email para restaurar tu contraseña');
    }
    setAccountOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setAccountOpen(false);
    toast.success('Sesión cerrada');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <MasterChefLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!isEnrolled && (
              <Button asChild size="sm" className="gap-2">
                <Link to="/inscripcion">
                  <Flame className="w-4 h-4" />
                  Inscribirme a El Reto
                </Link>
              </Button>
            )}
            {!loading && (
              user ? (
                <div className="relative">
                  <button
                    onClick={() => setAccountOpen(!accountOpen)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-muted text-foreground text-sm h-9 px-2.5 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {isEmoji ? (
                        <span className="text-sm">{avatarUrl}</span>
                      ) : avatarUrl?.startsWith('http') ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ChefHat className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <span className="font-medium max-w-[100px] truncate">{displayName}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {accountOpen && <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />}

                  {accountOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                      <div className="px-4 py-3 border-b border-border bg-muted/50">
                        <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="py-1.5">
                        <DropdownItem icon={<Flame className="w-4 h-4" />} label="Dashboard" onClick={() => { navigate('/dashboard'); setAccountOpen(false); }} />
                        <DropdownItem icon={<User className="w-4 h-4" />} label="Perfil" onClick={() => { navigate('/profile'); setAccountOpen(false); }} />
                        <DropdownItem icon={<BookOpen className="w-4 h-4" />} label="Mi Recetario" onClick={() => { navigate('/recetario/biblioteca'); setAccountOpen(false); }} />
                        {isAdmin && (
                          <DropdownItem icon={<Shield className="w-4 h-4" />} label="Admin" onClick={() => { navigate('/admin'); setAccountOpen(false); }} />
                        )}
                        <div className="my-1.5 border-t border-border" />
                        <DropdownItem icon={<Settings className="w-4 h-4" />} label="Editar perfil y redes" onClick={() => { navigate('/profile'); setAccountOpen(false); }} />
                        <DropdownItem icon={<KeyRound className="w-4 h-4" />} label="Restaurar contraseña" onClick={handleResetPassword} />
                        <div className="my-1.5 border-t border-border" />
                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <Link to="/auth">
                    <LogIn className="w-4 h-4" />
                    Iniciar sesión
                  </Link>
                </Button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm font-medium py-2 transition-colors ${
                    location.pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
                {!isEnrolled && (
                  <Button asChild size="sm" className="gap-2 w-full">
                    <Link to="/inscripcion" onClick={() => setIsMenuOpen(false)}>
                      <Flame className="w-4 h-4" />
                      Inscribirme a El Reto
                    </Link>
                  </Button>
                )}
                {!loading && (
                  user ? (
                    <>
                      <Button asChild size="sm" variant="outline" className="gap-2 w-full">
                        <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                          <User className="w-4 h-4" />
                          Mi cuenta
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button asChild size="sm" variant="outline" className="gap-2 w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                          <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                            <Shield className="w-4 h-4" />
                            Admin
                          </Link>
                        </Button>
                      )}
                      <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="text-sm text-destructive py-2 text-left">
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="gap-2 w-full">
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                        <LogIn className="w-4 h-4" />
                        Iniciar sesión
                      </Link>
                    </Button>
                  )
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

const DropdownItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
  >
    {icon}
    {label}
  </button>
);
