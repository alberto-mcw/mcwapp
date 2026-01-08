import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Check, X, Trash2, Edit, Video, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  energy_reward: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

interface Submission {
  id: string;
  user_id: string;
  challenge_id: string;
  video_url: string;
  thumbnail_url: string | null;
  description: string | null;
  status: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  challenge?: {
    title: string;
  };
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: 'weekly',
    energy_reward: 100,
    is_active: true,
    starts_at: '',
    ends_at: ''
  });

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/dashboard');
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de administrador",
          variant: "destructive"
        });
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    
    // Fetch all challenges (admin can see all)
    const { data: challengesData } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch all submissions with profile and challenge info
    const { data: submissionsData } = await supabase
      .from('challenge_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (submissionsData) {
      // Fetch profiles and challenges for submissions
      const enrichedSubmissions = await Promise.all(
        submissionsData.map(async (sub) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email, avatar_url')
            .eq('user_id', sub.user_id)
            .maybeSingle();

          const { data: challenge } = await supabase
            .from('challenges')
            .select('title')
            .eq('id', sub.challenge_id)
            .maybeSingle();

          return { ...sub, profile, challenge };
        })
      );
      setSubmissions(enrichedSubmissions);
    }

    setChallenges(challengesData || []);
    setLoadingData(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.title || !formData.description || !formData.starts_at || !formData.ends_at) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (editingChallenge) {
      const { error } = await supabase
        .from('challenges')
        .update({
          title: formData.title,
          description: formData.description,
          challenge_type: formData.challenge_type,
          energy_reward: formData.energy_reward,
          is_active: formData.is_active,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at
        })
        .eq('id', editingChallenge.id);

      if (error) {
        toast({ title: "Error al actualizar", variant: "destructive" });
      } else {
        toast({ title: "Desafío actualizado" });
      }
    } else {
      const { error } = await supabase
        .from('challenges')
        .insert({
          title: formData.title,
          description: formData.description,
          challenge_type: formData.challenge_type,
          energy_reward: formData.energy_reward,
          is_active: formData.is_active,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at,
          created_by: user?.id
        });

      if (error) {
        toast({ title: "Error al crear", variant: "destructive" });
      } else {
        toast({ title: "Desafío creado" });
      }
    }

    resetForm();
    setIsDialogOpen(false);
    fetchData();
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      challenge_type: challenge.challenge_type,
      energy_reward: challenge.energy_reward,
      is_active: challenge.is_active,
      starts_at: challenge.starts_at,
      ends_at: challenge.ends_at
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    } else {
      toast({ title: "Desafío eliminado" });
      fetchData();
    }
  };

  const handleToggleActive = async (challenge: Challenge) => {
    const { error } = await supabase
      .from('challenges')
      .update({ is_active: !challenge.is_active })
      .eq('id', challenge.id);

    if (!error) {
      fetchData();
    }
  };

  const handleApproveSubmission = async (submission: Submission) => {
    // Update submission status
    const { error: updateError } = await supabase
      .from('challenge_submissions')
      .update({ status: 'approved' })
      .eq('id', submission.id);

    if (updateError) {
      toast({ title: "Error al aprobar", variant: "destructive" });
      return;
    }

    // Add energy to user
    const { error: energyError } = await supabase
      .from('profiles')
      .update({ total_energy: supabase.rpc ? undefined : 100 })
      .eq('user_id', submission.user_id);

    // Use RPC to increment energy
    await supabase.rpc('increment_user_energy', {
      p_user_id: submission.user_id,
      p_amount: 100
    });

    toast({ title: "Vídeo aprobado y energía añadida" });
    fetchData();
  };

  const handleRejectSubmission = async (id: string) => {
    const { error } = await supabase
      .from('challenge_submissions')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      toast({ title: "Error al rechazar", variant: "destructive" });
    } else {
      toast({ title: "Vídeo rechazado" });
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      challenge_type: 'weekly',
      energy_reward: 100,
      is_active: true,
      starts_at: '',
      ends_at: ''
    });
    setEditingChallenge(null);
  };

  if (authLoading || adminLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-unbounded text-2xl md:text-3xl font-bold mb-2">
                Panel de <span className="text-gradient-fire">Administración</span>
              </h1>
              <p className="text-muted-foreground">
                Gestiona los desafíos y aprueba vídeos
              </p>
            </div>
            {pendingSubmissions.length > 0 && (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {pendingSubmissions.length} pendiente{pendingSubmissions.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <Tabs defaultValue="challenges" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="challenges" className="gap-2">
                <Calendar className="w-4 h-4" />
                Desafíos
              </TabsTrigger>
              <TabsTrigger value="submissions" className="gap-2">
                <Video className="w-4 h-4" />
                Vídeos
                {pendingSubmissions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingSubmissions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Challenges Tab */}
            <TabsContent value="challenges" className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Nuevo Desafío
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingChallenge ? 'Editar Desafío' : 'Crear Nuevo Desafío'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Título *</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Ej: Cocina tu mejor tortilla"
                        />
                      </div>
                      <div>
                        <Label>Descripción *</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe el desafío..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Fecha inicio *</Label>
                          <Input
                            type="date"
                            value={formData.starts_at}
                            onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Fecha fin *</Label>
                          <Input
                            type="date"
                            value={formData.ends_at}
                            onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Recompensa de energía</Label>
                        <Input
                          type="number"
                          value={formData.energy_reward}
                          onChange={(e) => setFormData({ ...formData, energy_reward: parseInt(e.target.value) || 100 })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label>Desafío activo</Label>
                      </div>
                      <Button onClick={handleCreateOrUpdate} className="w-full">
                        {editingChallenge ? 'Guardar cambios' : 'Crear desafío'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {challenges.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No hay desafíos creados aún
                    </CardContent>
                  </Card>
                ) : (
                  challenges.map((challenge) => (
                    <Card key={challenge.id} className={!challenge.is_active ? 'opacity-60' : ''}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-unbounded font-bold">{challenge.title}</h3>
                              <Badge variant={challenge.is_active ? 'default' : 'secondary'}>
                                {challenge.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                              <Badge variant="outline">{challenge.challenge_type}</Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{challenge.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>⚡ {challenge.energy_reward} energía</span>
                              <span>📅 {format(new Date(challenge.starts_at), 'dd MMM', { locale: es })} - {format(new Date(challenge.ends_at), 'dd MMM yyyy', { locale: es })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(challenge)}
                              title={challenge.is_active ? 'Desactivar' : 'Activar'}
                            >
                              {challenge.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(challenge)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(challenge.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="space-y-6">
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pendientes ({pendingSubmissions.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Aprobados ({submissions.filter(s => s.status === 'approved').length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rechazados ({submissions.filter(s => s.status === 'rejected').length})
                  </TabsTrigger>
                </TabsList>

                {['pending', 'approved', 'rejected'].map((status) => (
                  <TabsContent key={status} value={status} className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {submissions
                        .filter(s => s.status === status)
                        .map((submission) => (
                          <Card key={submission.id}>
                            <CardContent className="p-4">
                              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                                <video
                                  src={submission.video_url}
                                  controls
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {submission.profile?.display_name || submission.profile?.email || 'Usuario'}
                                  </span>
                                  <Badge variant={
                                    status === 'approved' ? 'default' :
                                    status === 'rejected' ? 'destructive' : 'secondary'
                                  }>
                                    {status === 'pending' ? 'Pendiente' :
                                     status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                  </Badge>
                                </div>
                                {submission.challenge && (
                                  <p className="text-sm text-muted-foreground">
                                    Desafío: {submission.challenge.title}
                                  </p>
                                )}
                                {submission.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {submission.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(submission.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                                </p>
                                {status === 'pending' && (
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveSubmission(submission)}
                                      className="flex-1 gap-1"
                                    >
                                      <Check className="w-4 h-4" />
                                      Aprobar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectSubmission(submission.id)}
                                      className="flex-1 gap-1"
                                    >
                                      <X className="w-4 h-4" />
                                      Rechazar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {submissions.filter(s => s.status === status).length === 0 && (
                        <Card className="col-span-full">
                          <CardContent className="py-12 text-center text-muted-foreground">
                            No hay vídeos {status === 'pending' ? 'pendientes' : status === 'approved' ? 'aprobados' : 'rechazados'}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
