import { useState, useRef } from 'react';
import { usePresentationVideo } from '@/hooks/usePresentationVideo';
import { Video, Upload, Loader2, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const PresentationVideoCard = () => {
  const { video, loading, uploadVideo } = usePresentationVideo();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (loading) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast({ title: 'Archivo demasiado grande', description: 'Máximo 100MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const { error } = await uploadVideo(file);
    setUploading(false);

    if (error) {
      toast({ title: 'Error al subir el vídeo', variant: 'destructive' });
    } else {
      toast({ title: '🎬 ¡Vídeo enviado!', description: 'Un admin lo revisará para darte +100 energía' });
    }
  };

  // Already uploaded
  if (video) {
    const statusConfig = {
      pending: { icon: Clock, label: 'Pendiente de revisión', color: 'text-yellow-500' },
      approved: { icon: Check, label: '¡Aprobado! +100 energía', color: 'text-green-500' },
      rejected: { icon: Clock, label: 'No aprobado', color: 'text-destructive' },
    }[video.status] || { icon: Clock, label: video.status, color: 'text-muted-foreground' };

    const StatusIcon = statusConfig.icon;

    return (
      <div className="glass-card glow-soft p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Vídeo de presentación</p>
            <p className={`text-xs flex items-center gap-1 ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No video yet - show upload CTA
  return (
    <div className="bg-gradient-primary rounded-[2rem] p-4 text-primary-foreground glow-medium">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Video className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">🎬 Preséntate al mundo</p>
          <p className="text-xs opacity-90">Sube tu vídeo y gana +100 energía</p>
        </div>
      </div>
      <p className="text-xs opacity-80 mb-3">
        Cuéntanos quién eres y tu conexión con la cocina y MasterChef. Solo puedes subirlo una vez.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        variant="secondary"
        size="sm"
        className="w-full gap-2"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {uploading ? 'Subiendo...' : 'Subir vídeo de presentación'}
      </Button>
    </div>
  );
};
