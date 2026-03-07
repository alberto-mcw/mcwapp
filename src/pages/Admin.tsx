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
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Check, X, Trash2, Edit, Video, Calendar, Sparkles, Brain, CalendarDays, Clock, Star, Filter, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminCalendar } from '@/components/admin/AdminCalendar';
import { AdminPresentationVideos } from '@/components/admin/AdminPresentationVideos';
import { AdminVideoUpload } from '@/components/admin/AdminVideoUpload';
import { SuperLikeButton } from '@/components/gallery/SuperLikeButton';

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
  dish_name: string | null;
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
  hasSuperLike?: boolean;
}

interface DailyTrivia {
  id: string;
  scheduled_date: string;
  trivia_type: string;
  title: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  fun_fact: string;
  difficulty: string;
  energy_reward: number;
  status: string;
  created_at: string;
  approved_at: string | null;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [trivias, setTrivias] = useState<DailyTrivia[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [generatingTrivia, setGeneratingTrivia] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTriviaDialogOpen, setIsTriviaDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [editingTrivia, setEditingTrivia] = useState<DailyTrivia | null>(null);
  const [showOnlySuperLiked, setShowOnlySuperLiked] = useState(false);

  // Challenge form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: 'weekly',
    energy_reward: 100,
    is_active: true,
    starts_at: '',
    ends_at: ''
  });

  // Trivia form state
  const [triviaForm, setTriviaForm] = useState({
    scheduled_date: '',
    trivia_type: 'trivia',
    title: '',
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: '',
    fun_fact: '',
    difficulty: 'medio',
    energy_reward: 25
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
    
    // Fetch all challenges
    const { data: challengesData } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch all submissions
    const { data: submissionsData } = await supabase
      .from('challenge_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch all daily trivias
    const { data: triviasData } = await supabase
      .from('daily_trivias')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (submissionsData) {
      // Fetch superlikes
      const submissionIds = submissionsData.map(s => s.id);
      const { data: superLikesData } = await supabase
        .from('super_likes')
        .select('submission_id')
        .in('submission_id', submissionIds);
      
      const superLikedIds = superLikesData?.map(sl => sl.submission_id) || [];

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

          return { 
            ...sub, 
            profile, 
            challenge,
            hasSuperLike: superLikedIds.includes(sub.id)
          };
        })
      );
      setSubmissions(enrichedSubmissions);
    }

    setChallenges(challengesData || []);
    setTrivias((triviasData || []).map(t => ({
      ...t,
      options: Array.isArray(t.options) ? t.options : JSON.parse(t.options as string || '[]')
    })));
    setLoadingData(false);
  };

  // Generate trivia suggestions with AI
  const [brandContext, setBrandContext] = useState('');
  const [showBrandInput, setShowBrandInput] = useState(false);

  const generateTriviaSuggestion = async () => {
    setGeneratingTrivia(true);
    setShowBrandInput(false);
    try {
      const response = await supabase.functions.invoke('generate-daily-challenge', {
        body: { context: brandContext || undefined }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      const data = response.data;
      
      // Find next available date
      const existingDates = trivias.map(t => t.scheduled_date);
      let nextDate = new Date();
      while (existingDates.includes(format(nextDate, 'yyyy-MM-dd'))) {
        nextDate = addDays(nextDate, 1);
      }

      setTriviaForm({
        scheduled_date: format(nextDate, 'yyyy-MM-dd'),
        trivia_type: data.type || 'trivia',
        title: data.title || '',
        question: data.question || '',
        options: data.options || ['', '', '', ''],
        correct_answer: data.correct_answer || 0,
        explanation: data.explanation || '',
        fun_fact: data.fun_fact || '',
        difficulty: data.difficulty || 'medio',
        energy_reward: data.energy_reward || 25
      });
      
      setIsTriviaDialogOpen(true);
      toast({ title: 'Mini reto generado con IA', description: 'Revisa y programa el contenido' });
    } catch (error) {
      console.error('Error generating trivia:', error);
      toast({ title: 'Error al generar', variant: 'destructive' });
    } finally {
      setGeneratingTrivia(false);
    }
  };

  // Challenge CRUD
  const handleCreateOrUpdateChallenge = async () => {
    if (!formData.title || !formData.description || !formData.starts_at || !formData.ends_at) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    if (editingChallenge) {
      const { error } = await supabase
        .from('challenges')
        .update({ ...formData })
        .eq('id', editingChallenge.id);
      if (error) toast({ title: "Error al actualizar", variant: "destructive" });
      else toast({ title: "Desafío actualizado" });
    } else {
      const { error } = await supabase
        .from('challenges')
        .insert({ ...formData, created_by: user?.id });
      if (error) toast({ title: "Error al crear", variant: "destructive" });
      else toast({ title: "Desafío creado" });
    }

    resetChallengeForm();
    setIsDialogOpen(false);
    fetchData();
  };

  const handleEditChallenge = (challenge: Challenge) => {
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

  const handleDeleteChallenge = async (id: string) => {
    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (!error) { toast({ title: "Eliminado" }); fetchData(); }
  };

  const handleToggleActive = async (challenge: Challenge) => {
    await supabase.from('challenges').update({ is_active: !challenge.is_active }).eq('id', challenge.id);
    fetchData();
  };

  const resetChallengeForm = () => {
    setFormData({ title: '', description: '', challenge_type: 'weekly', energy_reward: 100, is_active: true, starts_at: '', ends_at: '' });
    setEditingChallenge(null);
  };

  // Trivia CRUD - No approval workflow, trivias activate automatically on scheduled_date at 8 AM CET
  const handleSaveTrivia = async () => {
    if (!triviaForm.scheduled_date || !triviaForm.question || triviaForm.options.some(o => !o)) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    const triviaData = {
      scheduled_date: triviaForm.scheduled_date,
      trivia_type: triviaForm.trivia_type,
      title: triviaForm.title,
      question: triviaForm.question,
      options: triviaForm.options,
      correct_answer: triviaForm.correct_answer,
      explanation: triviaForm.explanation,
      fun_fact: triviaForm.fun_fact,
      difficulty: triviaForm.difficulty,
      energy_reward: triviaForm.energy_reward,
      status: 'scheduled' // Auto-scheduled, no approval needed
    };

    if (editingTrivia) {
      const { error } = await supabase.from('daily_trivias').update(triviaData).eq('id', editingTrivia.id);
      if (error) toast({ title: "Error al actualizar", variant: "destructive" });
      else toast({ title: "Mini reto actualizado" });
    } else {
      const { error } = await supabase.from('daily_trivias').insert(triviaData);
      if (error) {
        if (error.code === '23505') toast({ title: "Ya existe mini reto para esa fecha", variant: "destructive" });
        else toast({ title: "Error al crear", variant: "destructive" });
      } else toast({ title: "Mini reto programado correctamente" });
    }

    resetTriviaForm();
    setIsTriviaDialogOpen(false);
    fetchData();
  };

  const handleDeleteTrivia = async (id: string) => {
    const { error } = await supabase.from('daily_trivias').delete().eq('id', id);
    if (!error) { toast({ title: "Mini reto eliminado" }); fetchData(); }
  };

  const handleEditTrivia = (trivia: DailyTrivia) => {
    setEditingTrivia(trivia);
    setTriviaForm({
      scheduled_date: trivia.scheduled_date,
      trivia_type: trivia.trivia_type,
      title: trivia.title,
      question: trivia.question,
      options: trivia.options,
      correct_answer: trivia.correct_answer,
      explanation: trivia.explanation,
      fun_fact: trivia.fun_fact,
      difficulty: trivia.difficulty,
      energy_reward: trivia.energy_reward
    });
    setIsTriviaDialogOpen(true);
  };

  const resetTriviaForm = () => {
    setTriviaForm({
      scheduled_date: '',
      trivia_type: 'trivia',
      title: '',
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      fun_fact: '',
      difficulty: 'medio',
      energy_reward: 25
    });
    setEditingTrivia(null);
  };

  // Submission handlers
  const handleApproveSubmission = async (submission: Submission) => {
    try {
      // Fetch challenge details to calculate correct reward
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('energy_reward, ends_at')
        .eq('id', submission.challenge_id)
        .single();

      if (!challengeData) {
        toast({ title: "Error", description: "No se pudo obtener información del desafío", variant: "destructive" });
        return;
      }

      // Calculate if submission was on time
      const submissionDate = new Date(submission.created_at).toISOString().split('T')[0];
      const wasOnTime = submissionDate <= challengeData.ends_at;
      
      // Full reward if on time, half if late
      const energyReward = wasOnTime 
        ? challengeData.energy_reward 
        : Math.floor(challengeData.energy_reward / 2);

      await supabase.from('challenge_submissions').update({ status: 'approved' }).eq('id', submission.id);
      await supabase.rpc('increment_user_energy', { p_user_id: submission.user_id, p_amount: energyReward });
      
      toast({ 
        title: "Vídeo aprobado", 
        description: `+${energyReward} puntos${wasOnTime ? ' (a tiempo)' : ' (fuera de plazo, mitad de puntos)'}`
      });
      fetchData();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({ title: "Error al aprobar", variant: "destructive" });
    }
  };

  const handleRejectSubmission = async (id: string) => {
    await supabase.from('challenge_submissions').update({ status: 'rejected' }).eq('id', id);
    toast({ title: "Vídeo rechazado" });
    fetchData();
  };

  // Reject an approved video and subtract energy
  const handleRevokeApproval = async (submission: Submission) => {
    try {
      // Fetch challenge details to calculate the energy to subtract
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('energy_reward, ends_at')
        .eq('id', submission.challenge_id)
        .single();

      if (!challengeData) {
        toast({ title: "Error", description: "No se pudo obtener información del desafío", variant: "destructive" });
        return;
      }

      // Calculate if submission was on time (same logic as approval)
      const submissionDate = new Date(submission.created_at).toISOString().split('T')[0];
      const wasOnTime = submissionDate <= challengeData.ends_at;
      
      // Full reward if on time, half if late - this is what was awarded
      const energyToSubtract = wasOnTime 
        ? challengeData.energy_reward 
        : Math.floor(challengeData.energy_reward / 2);

      // Update status to rejected
      await supabase.from('challenge_submissions').update({ status: 'rejected' }).eq('id', submission.id);
      
      // Subtract energy (negative amount)
      await supabase.rpc('increment_user_energy', { p_user_id: submission.user_id, p_amount: -energyToSubtract });
      
      toast({ 
        title: "Aprobación revocada", 
        description: `-${energyToSubtract} puntos restados al usuario`
      });
      fetchData();
    } catch (error) {
      console.error('Error revoking approval:', error);
      toast({ title: "Error al revocar aprobación", variant: "destructive" });
    }
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
  const futureTrivias = trivias.filter(t => new Date(t.scheduled_date) >= new Date(new Date().toISOString().split('T')[0]));

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
              <p className="text-muted-foreground">Gestiona mini retos diarios, desafíos semanales y vídeos</p>
            </div>
            <div className="flex gap-2">
              {futureTrivias.length > 0 && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {futureTrivias.length} mini reto{futureTrivias.length > 1 ? 's' : ''} programado{futureTrivias.length > 1 ? 's' : ''}
                </Badge>
              )}
              {pendingSubmissions.length > 0 && (
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  {pendingSubmissions.length} vídeo{pendingSubmissions.length > 1 ? 's' : ''} pendiente{pendingSubmissions.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="calendario" className="space-y-6">
            <TabsList className="grid w-full max-w-4xl grid-cols-6">
              <TabsTrigger value="calendario" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="trivias" className="gap-2">
                <Brain className="w-4 h-4" />
                Mini Retos
                {futureTrivias.length > 0 && <Badge variant="secondary" className="ml-1">{futureTrivias.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="challenges" className="gap-2">
                <Calendar className="w-4 h-4" />
                Desafíos
              </TabsTrigger>
              <TabsTrigger value="submissions" className="gap-2">
                <Video className="w-4 h-4" />
                Vídeos
                {pendingSubmissions.length > 0 && <Badge variant="secondary" className="ml-1">{pendingSubmissions.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Link2 className="w-4 h-4" />
                Carga ext.
              </TabsTrigger>
              <TabsTrigger value="presentaciones" className="gap-2">
                🎬 Present.
              </TabsTrigger>
            </TabsList>

            {/* CALENDARIO TAB */}
            <TabsContent value="calendario" className="space-y-6">
              <AdminCalendar
                trivias={trivias}
                challenges={challenges}
                onSelectDate={(date, type) => {
                  if (type === 'trivia') {
                    setTriviaForm({
                      ...triviaForm,
                      scheduled_date: format(date, 'yyyy-MM-dd')
                    });
                    setIsTriviaDialogOpen(true);
                  } else {
                    setFormData({
                      ...formData,
                      starts_at: format(date, 'yyyy-MM-dd'),
                      ends_at: format(addDays(date, 6), 'yyyy-MM-dd')
                    });
                    setIsDialogOpen(true);
                  }
                }}
                onEditTrivia={(trivia) => {
                  const fullTrivia = trivias.find(t => t.id === trivia.id);
                  if (fullTrivia) {
                    setEditingTrivia(fullTrivia);
                    setTriviaForm({
                      scheduled_date: fullTrivia.scheduled_date,
                      trivia_type: fullTrivia.trivia_type,
                      title: fullTrivia.title,
                      question: fullTrivia.question,
                      options: fullTrivia.options,
                      correct_answer: fullTrivia.correct_answer,
                      explanation: fullTrivia.explanation,
                      fun_fact: fullTrivia.fun_fact,
                      difficulty: fullTrivia.difficulty,
                      energy_reward: fullTrivia.energy_reward
                    });
                    setIsTriviaDialogOpen(true);
                  }
                }}
                onEditChallenge={(challenge) => {
                  const fullChallenge = challenges.find(c => c.id === challenge.id);
                  if (fullChallenge) {
                    handleEditChallenge(fullChallenge);
                  }
                }}
              />

              <div className="flex gap-2 justify-end items-end">
                <div className="flex flex-col gap-2">
                  {showBrandInput && (
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Ej: Mini Reto SOS (marca de arroz)"
                        value={brandContext}
                        onChange={(e) => setBrandContext(e.target.value)}
                        className="w-72 text-sm"
                      />
                      <Button size="sm" variant="ghost" onClick={() => setShowBrandInput(false)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => showBrandInput ? generateTriviaSuggestion() : setShowBrandInput(true)}
                      disabled={generatingTrivia}
                      variant="outline"
                      className="gap-2"
                    >
                      {generatingTrivia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generar Mini Reto con IA
                    </Button>
                  </div>
                </div>
                <Button onClick={() => setIsTriviaDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Mini Reto
                </Button>
                <Button onClick={() => setIsDialogOpen(true)} variant="secondary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Desafío
                </Button>
              </div>
            </TabsContent>

            {/* TRIVIAS TAB */}
            <TabsContent value="trivias" className="space-y-6">
              <div className="flex gap-2 justify-end">
                <div className="flex flex-col gap-2 items-end">
                  {showBrandInput && (
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Ej: Mini Reto SOS (marca de arroz)"
                        value={brandContext}
                        onChange={(e) => setBrandContext(e.target.value)}
                        className="w-72 text-sm"
                      />
                      <Button size="sm" variant="ghost" onClick={() => setShowBrandInput(false)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <Button
                    onClick={() => showBrandInput ? generateTriviaSuggestion() : setShowBrandInput(true)}
                    disabled={generatingTrivia}
                    variant="outline"
                    className="gap-2"
                  >
                    {generatingTrivia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generar con IA
                  </Button>
                </div>
                <Button onClick={() => { resetTriviaForm(); setIsTriviaDialogOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />Nuevo Mini Reto
                </Button>
              </div>

              {/* Trivias list - grouped by status */}
              <div className="space-y-6">
                {/* Future trivias */}
                <div>
                  <h3 className="font-unbounded font-bold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Programadas ({trivias.filter(t => new Date(t.scheduled_date) > new Date()).length})
                  </h3>
                  <div className="grid gap-3">
                    {trivias.filter(t => new Date(t.scheduled_date) >= new Date(new Date().toISOString().split('T')[0])).map((trivia) => (
                      <Card key={trivia.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{format(new Date(trivia.scheduled_date), 'dd MMM yyyy', { locale: es })}</Badge>
                                <Badge variant="default">Programada</Badge>
                                <Badge variant="outline">{trivia.difficulty}</Badge>
                              </div>
                              <h3 className="font-unbounded font-bold mb-1">{trivia.title}</h3>
                              <p className="text-muted-foreground text-sm mb-2">{trivia.question}</p>
                              <div className="flex flex-wrap gap-1">
                                {trivia.options.map((opt, idx) => (
                                  <span key={idx} className={`text-xs px-2 py-1 rounded ${idx === trivia.correct_answer ? 'bg-green-500/20 text-green-500' : 'bg-muted'}`}>
                                    {String.fromCharCode(65 + idx)}: {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleEditTrivia(trivia)}><Edit className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteTrivia(trivia.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {trivias.filter(t => new Date(t.scheduled_date) >= new Date(new Date().toISOString().split('T')[0])).length === 0 && (
                      <Card><CardContent className="py-8 text-center text-muted-foreground">No hay mini retos programados</CardContent></Card>
                    )}
                  </div>
                </div>

                {/* Past trivias */}
                <div>
                  <h3 className="font-unbounded font-bold mb-3 flex items-center gap-2 text-muted-foreground">
                    Pasadas ({trivias.filter(t => new Date(t.scheduled_date) < new Date(new Date().toISOString().split('T')[0])).length})
                  </h3>
                  <div className="grid gap-3">
                    {trivias.filter(t => new Date(t.scheduled_date) < new Date(new Date().toISOString().split('T')[0])).slice(0, 5).map((trivia) => (
                      <Card key={trivia.id} className="opacity-60">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{format(new Date(trivia.scheduled_date), 'dd MMM yyyy', { locale: es })}</Badge>
                                <Badge variant="secondary">Finalizada</Badge>
                              </div>
                              <h3 className="font-unbounded font-bold mb-1">{trivia.title}</h3>
                              <p className="text-muted-foreground text-sm">{trivia.question}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteTrivia(trivia.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {trivias.filter(t => new Date(t.scheduled_date) < new Date(new Date().toISOString().split('T')[0])).length === 0 && (
                      <Card><CardContent className="py-8 text-center text-muted-foreground">No hay mini retos pasados</CardContent></Card>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* CHALLENGES TAB */}
            <TabsContent value="challenges" className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetChallengeForm(); }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="w-4 h-4" />Nuevo Desafío</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingChallenge ? 'Editar Desafío' : 'Crear Nuevo Desafío'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div><Label>Título *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Cocina tu mejor tortilla" /></div>
                      <div><Label>Descripción *</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Fecha inicio *</Label><Input type="date" value={formData.starts_at} onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })} /></div>
                        <div><Label>Fecha fin *</Label><Input type="date" value={formData.ends_at} onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })} /></div>
                      </div>
                      <div><Label>Recompensa de puntos</Label><Input type="number" value={formData.energy_reward} onChange={(e) => setFormData({ ...formData, energy_reward: parseInt(e.target.value) || 100 })} /></div>
                      <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label>Desafío activo</Label></div>
                      <Button onClick={handleCreateOrUpdateChallenge} className="w-full">{editingChallenge ? 'Guardar cambios' : 'Crear desafío'}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {challenges.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">No hay desafíos creados</CardContent></Card>
                ) : (
                  challenges.map((challenge) => (
                    <Card key={challenge.id} className={!challenge.is_active ? 'opacity-60' : ''}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-unbounded font-bold">{challenge.title}</h3>
                              <Badge variant={challenge.is_active ? 'default' : 'secondary'}>{challenge.is_active ? 'Activo' : 'Inactivo'}</Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{challenge.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>⚡ {challenge.energy_reward} energía</span>
                              <span>📅 {format(new Date(challenge.starts_at), 'dd MMM', { locale: es })} - {format(new Date(challenge.ends_at), 'dd MMM yyyy', { locale: es })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleActive(challenge)}>{challenge.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}</Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditChallenge(challenge)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteChallenge(challenge.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* SUBMISSIONS TAB */}
            <TabsContent value="submissions" className="space-y-6">
              <Tabs defaultValue="pending">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <TabsList>
                    <TabsTrigger value="pending">Pendientes ({pendingSubmissions.length})</TabsTrigger>
                    <TabsTrigger value="approved">Aprobados ({submissions.filter(s => s.status === 'approved').length})</TabsTrigger>
                    <TabsTrigger value="rejected">Rechazados ({submissions.filter(s => s.status === 'rejected').length})</TabsTrigger>
                  </TabsList>
                  
                  {/* SuperLike filter for approved videos */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showOnlySuperLiked ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowOnlySuperLiked(!showOnlySuperLiked)}
                      className="gap-2"
                    >
                      <Star className={`w-4 h-4 ${showOnlySuperLiked ? 'fill-white' : ''}`} />
                      Solo TOP
                      {showOnlySuperLiked && (
                        <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                          {submissions.filter(s => s.status === 'approved' && s.hasSuperLike).length}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>

                {['pending', 'approved', 'rejected'].map((status) => {
                  const filteredVideos = submissions.filter(s => {
                    if (s.status !== status) return false;
                    if (status === 'approved' && showOnlySuperLiked && !s.hasSuperLike) return false;
                    return true;
                  });
                  
                  return (
                  <TabsContent key={status} value={status} className="mt-6">
                    <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                      {filteredVideos.map((submission) => (
                        <Card key={submission.id} className={`overflow-hidden ${submission.hasSuperLike ? 'ring-2 ring-yellow-500/50 border-yellow-500/50' : ''}`}>
                          <CardContent className="p-2">
                            {/* SuperLike badge */}
                            {submission.hasSuperLike && (
                              <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold py-0.5 rounded mb-1">
                                <Star className="w-3 h-3 fill-white" />
                                TOP
                              </div>
                            )}
                            <div className="aspect-[9/16] rounded-md overflow-hidden bg-muted mb-2">
                              <video src={submission.video_url} controls className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium truncate">{submission.profile?.display_name || submission.profile?.email || 'Usuario'}</p>
                              {submission.dish_name && <p className="text-[10px] text-primary font-medium truncate">{submission.dish_name}</p>}
                              {submission.challenge && <p className="text-[10px] text-muted-foreground truncate">{submission.challenge.title}</p>}
                              <Badge variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                {status === 'pending' ? 'Pend.' : status === 'approved' ? 'Aprobado' : 'Rech.'}
                              </Badge>
                              {status === 'pending' && (
                                <div className="flex gap-1 pt-1">
                                  <Button size="sm" onClick={() => handleApproveSubmission(submission)} className="flex-1 h-6 text-[10px] px-1"><Check className="w-3 h-3" /></Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleRejectSubmission(submission.id)} className="flex-1 h-6 text-[10px] px-1"><X className="w-3 h-3" /></Button>
                                </div>
                              )}
                              {status === 'approved' && (
                                <div className="space-y-1 pt-1">
                                  {/* SuperLike Button */}
                                  <SuperLikeButton
                                    submissionId={submission.id}
                                    hasSuperLike={submission.hasSuperLike || false}
                                    isAdmin={true}
                                    onSuperLikeChange={(hasSuperLike) => {
                                      setSubmissions(prev => prev.map(s => 
                                        s.id === submission.id ? { ...s, hasSuperLike } : s
                                      ));
                                    }}
                                    chefName={submission.profile?.display_name || 'Chef'}
                                    dishName={submission.dish_name || 'Plato sin nombre'}
                                  />
                                  {/* Revoke button */}
                                  <Button size="sm" variant="destructive" onClick={() => handleRevokeApproval(submission)} className="w-full h-6 text-[10px] px-1"><X className="w-3 h-3 mr-1" />Revocar</Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {filteredVideos.length === 0 && (
                        <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">
                          {showOnlySuperLiked && status === 'approved' 
                            ? 'No hay vídeos TOP' 
                            : `No hay vídeos ${status === 'pending' ? 'pendientes' : status === 'approved' ? 'aprobados' : 'rechazados'}`}
                        </CardContent></Card>
                      )}
                    </div>
                  </TabsContent>
                )})}
              </Tabs>
            </TabsContent>

            {/* ADMIN VIDEO UPLOAD TAB */}
            <TabsContent value="upload" className="space-y-6">
              <AdminVideoUpload />
            </TabsContent>

            {/* PRESENTATION VIDEOS TAB */}
            <TabsContent value="presentaciones" className="space-y-6">
              <AdminPresentationVideos />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Trivia Dialog - outside tabs so it works from anywhere */}
      <Dialog open={isTriviaDialogOpen} onOpenChange={(open) => { setIsTriviaDialogOpen(open); if (!open) resetTriviaForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTrivia ? 'Editar Mini Reto' : 'Nuevo Mini Reto Diario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha programada *</Label>
                <Input type="date" value={triviaForm.scheduled_date} onChange={(e) => setTriviaForm({ ...triviaForm, scheduled_date: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={triviaForm.trivia_type} onValueChange={(v) => setTriviaForm({ ...triviaForm, trivia_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trivia">🧠 Trivia</SelectItem>
                    <SelectItem value="guess_dish">🍽️ Adivinar plato</SelectItem>
                    <SelectItem value="ingredient">🥄 Ingrediente</SelectItem>
                    <SelectItem value="technique">👨‍🍳 Técnica</SelectItem>
                    <SelectItem value="origin">🌍 Origen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={triviaForm.title} onChange={(e) => setTriviaForm({ ...triviaForm, title: e.target.value })} placeholder="Ej: Maestro de las especias" />
            </div>
            <div>
              <Label>Pregunta *</Label>
              <Textarea value={triviaForm.question} onChange={(e) => setTriviaForm({ ...triviaForm, question: e.target.value })} placeholder="¿Cuál es el ingrediente principal del...?" rows={2} />
            </div>
            <div>
              <Label>Opciones * (marca la correcta)</Label>
              <div className="space-y-2 mt-2">
                {triviaForm.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Button type="button" variant={triviaForm.correct_answer === idx ? "default" : "outline"} size="sm" onClick={() => setTriviaForm({ ...triviaForm, correct_answer: idx })} className="w-8 h-8 p-0">
                      {String.fromCharCode(65 + idx)}
                    </Button>
                    <Input value={opt} onChange={(e) => { const newOpts = [...triviaForm.options]; newOpts[idx] = e.target.value; setTriviaForm({ ...triviaForm, options: newOpts }); }} placeholder={`Opción ${String.fromCharCode(65 + idx)}`} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Explicación *</Label>
              <Textarea value={triviaForm.explanation} onChange={(e) => setTriviaForm({ ...triviaForm, explanation: e.target.value })} placeholder="Por qué esta es la respuesta correcta..." rows={2} />
            </div>
            <div>
              <Label>Dato curioso *</Label>
              <Textarea value={triviaForm.fun_fact} onChange={(e) => setTriviaForm({ ...triviaForm, fun_fact: e.target.value })} placeholder="¿Sabías que...?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dificultad</Label>
                <Select value={triviaForm.difficulty} onValueChange={(v) => setTriviaForm({ ...triviaForm, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fácil">Fácil</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="difícil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Energía</Label>
                <Input type="number" value={triviaForm.energy_reward} onChange={(e) => setTriviaForm({ ...triviaForm, energy_reward: parseInt(e.target.value) || 25 })} />
              </div>
            </div>
            <Button onClick={handleSaveTrivia} className="w-full">{editingTrivia ? 'Guardar cambios' : 'Guardar mini reto'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Admin;
