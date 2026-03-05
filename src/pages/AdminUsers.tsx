import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2, Search, ChefHat, Shield, Ban, Undo2,
  Zap, ExternalLink, Users, ArrowUpDown, ArrowDown, ArrowUp
} from 'lucide-react';
import { toast } from 'sonner';

const EMOJI_AVATARS = ['🍕','🍷','🥐','🍣','☕','🍞','🍾','🍜','🦪','🍰','🔪','🍏','🌯','🍫','🍔','🧋','🍝','🍦','🥘','🍪'];

interface UserRow {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  total_energy: number;
  country: string | null;
  city: string | null;
  created_at: string;
  banned_at: string | null;
  instagram_handle: string | null;
}

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [sortByEnergy, setSortByEnergy] = useState<'desc' | 'asc' | null>(null);
  const [banDialog, setBanDialog] = useState<UserRow | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) navigate('/auth');
      else if (!isAdmin) {
        navigate('/');
        toast.error('Acceso denegado');
      }
    }
  }, [user, isAdmin, authLoading, adminLoading]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, email, avatar_url, total_energy, country, city, created_at, banned_at, instagram_handle')
      .order('created_at', { ascending: false });

    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const handleBan = async (u: UserRow) => {
    setProcessing(true);
    const isBanned = !!u.banned_at;
    const { error } = await supabase
      .from('profiles')
      .update({ banned_at: isBanned ? null : new Date().toISOString() })
      .eq('user_id', u.user_id);

    if (error) {
      toast.error('Error al actualizar usuario');
    } else {
      toast.success(isBanned ? 'Usuario desbaneado' : 'Usuario baneado');
      fetchUsers();
    }
    setProcessing(false);
    setBanDialog(null);
  };

  const cities = Array.from(new Set(users.map(u => u.city).filter(Boolean) as string[])).sort();

  const filtered = users
    .filter(u => {
      if (cityFilter && u.city !== cityFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.instagram_handle?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortByEnergy === 'desc') return b.total_energy - a.total_energy;
      if (sortByEnergy === 'asc') return a.total_energy - b.total_energy;
      return 0;
    });

  const renderAvatar = (avatarUrl: string | null | undefined) => {
    if (avatarUrl && EMOJI_AVATARS.includes(avatarUrl)) {
      return (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-xl">{avatarUrl}</span>
        </div>
      );
    }
    if (avatarUrl?.startsWith('http')) {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <ChefHat className="w-5 h-5 text-primary" />
      </div>
    );
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="font-unbounded text-2xl font-bold">
              Usuarios registrados
            </h1>
            <Badge variant="secondary" className="ml-auto">
              {users.length} usuarios
            </Badge>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Select value={cityFilter ?? '__all__'} onValueChange={(v) => setCityFilter(v === '__all__' ? null : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las ciudades</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortByEnergy(prev => prev === 'desc' ? 'asc' : prev === 'asc' ? null : 'desc')}
              className="gap-1.5"
            >
              {sortByEnergy === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : sortByEnergy === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowUpDown className="w-3.5 h-3.5" />}
              Energía
            </Button>

            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email, ciudad o Instagram..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => {
                const isBanned = !!u.banned_at;
                return (
                  <Card
                    key={u.id}
                    className={`transition-colors ${isBanned ? 'opacity-50 border-destructive/30' : ''}`}
                  >
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      {renderAvatar(u.avatar_url)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {u.display_name || 'Sin nombre'}
                          </p>
                          {isBanned && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Baneado
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3 text-primary" />
                            {u.total_energy}
                          </span>
                          {u.country && (
                            <span className="text-xs text-muted-foreground">{u.country}</span>
                          )}
                          {u.city && (
                            <span className="text-xs text-muted-foreground">{u.city}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/profile?user=${u.user_id}`)}
                          title="Ver perfil"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={isBanned ? 'outline' : 'ghost'}
                          size="icon"
                          className={`h-8 w-8 ${!isBanned ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-700'}`}
                          onClick={() => setBanDialog(u)}
                          title={isBanned ? 'Desbanear' : 'Banear'}
                        >
                          {isBanned ? <Undo2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No se encontraron usuarios
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Ban confirmation dialog */}
      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banDialog?.banned_at ? 'Desbanear usuario' : 'Banear usuario'}
            </DialogTitle>
            <DialogDescription>
              {banDialog?.banned_at
                ? `¿Quieres desbanear a ${banDialog?.display_name || banDialog?.email}?`
                : `¿Estás seguro de que quieres banear a ${banDialog?.display_name || banDialog?.email}? El usuario no podrá acceder a la plataforma.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>
              Cancelar
            </Button>
            <Button
              variant={banDialog?.banned_at ? 'default' : 'destructive'}
              onClick={() => banDialog && handleBan(banDialog)}
              disabled={processing}
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {banDialog?.banned_at ? 'Desbanear' : 'Banear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
