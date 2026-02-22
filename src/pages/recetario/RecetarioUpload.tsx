import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Image, X, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

type FileItem = {
  id: string;
  file: File;
  preview: string | null;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  recipeId?: string;
  error?: string;
};

export default function RecetarioUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);

  const leadId = sessionStorage.getItem("recetario_lead_id");
  const email = sessionStorage.getItem("recetario_email");

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const items: FileItem[] = [];
    Array.from(newFiles).forEach((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: formato no válido.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: demasiado grande (máx. 10MB).`);
        return;
      }
      const item: FileItem = {
        id: crypto.randomUUID(),
        file: f,
        preview: null,
        status: "pending",
      };
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, preview: e.target?.result as string } : p
            )
          );
        };
        reader.readAsDataURL(f);
      }
      items.push(item);
    });
    if (items.length > 0) {
      setFiles((prev) => [...prev, ...items]);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  if (!leadId || !email) {
    navigate("/recetario");
    return null;
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  const processFile = async (item: FileItem): Promise<FileItem> => {
    // Update status to uploading
    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" as const } : f))
    );

    try {
      const ext = item.file.name.split(".").pop() || "jpg";
      const fileName = `${leadId}/${Date.now()}-${item.id.slice(0, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, item.file, { contentType: item.file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      const recipeId = crypto.randomUUID();

      const { error: insertError } = await supabase.from("recipes").insert({
        id: recipeId,
        lead_id: leadId,
        original_image_url: imageUrl,
        status: "processing",
      });

      if (insertError) throw insertError;

      // Update status to processing
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "processing" as const, recipeId } : f
        )
      );

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "process-recipe",
        { body: { imageUrl, recipeId, action: "full-process" } }
      );

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      return { ...item, status: "done", recipeId };
    } catch (err: any) {
      console.error(err);
      return { ...item, status: "error", error: err.message || "Error al procesar" };
    }
  };

  const handleSubmitAll = async () => {
    if (pendingCount === 0) return;
    setProcessing(true);

    const pending = files.filter((f) => f.status === "pending");

    for (const item of pending) {
      const result = await processFile(item);
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? result : f))
      );
    }

    setProcessing(false);
    toast.success("¡Proceso completado!");
  };

  const singleDone = files.length === 1 && files[0].status === "done" && files[0].recipeId;

  return (
    <div className="min-h-screen recetario-vichy-bg flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-2">
        <img src="/images/recetario-logo.png" alt="Mi Recetario Eterno" className="h-10" />
      </header>

      <div className="flex-1 flex items-start justify-center px-6 pb-12 pt-4">
        <div className="w-full max-w-2xl">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-center text-recetario-fg mb-2">
            Sube tus recetas manuscritas
          </h1>
          <p className="text-center text-recetario-muted text-sm mb-8 font-body">
            Puedes subir una o varias recetas a la vez. La IA las digitalizará todas.
          </p>

          {/* Drop zone — always visible when not processing */}
          {!processing && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all mb-6 ${
                dragOver
                  ? "border-recetario-primary bg-recetario-primary/5"
                  : "border-recetario-primary/30 bg-recetario-card hover:border-recetario-primary/50 hover:bg-recetario-bg"
              }`}
            >
              <div className="w-14 h-14 bg-recetario-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-recetario-primary" />
              </div>
              <p className="font-display text-base font-bold text-recetario-fg mb-1">
                {files.length === 0
                  ? "Arrastra tus imágenes aquí"
                  : "Añadir más recetas"}
              </p>
              <p className="text-xs text-recetario-muted-light font-body">
                JPG, PNG, WebP o PDF · Máx. 10MB cada una
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-3 mb-6">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="bg-recetario-card rounded-2xl p-3 border border-recetario-border flex items-center gap-3 shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-recetario-bg flex-shrink-0 flex items-center justify-center">
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-recetario-muted-light" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-recetario-fg truncate font-body">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-recetario-muted-light font-body">
                      {(item.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {item.status === "uploading" && (
                      <p className="text-xs text-recetario-primary font-body flex items-center gap-1 mt-0.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                      </p>
                    )}
                    {item.status === "processing" && (
                      <p className="text-xs text-recetario-primary font-body flex items-center gap-1 mt-0.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Digitalizando con IA...
                      </p>
                    )}
                    {item.status === "done" && (
                      <p className="text-xs text-green-600 font-body flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Completada
                      </p>
                    )}
                    {item.status === "error" && (
                      <p className="text-xs text-destructive font-body flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> {item.error}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {item.status === "pending" && !processing && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="w-8 h-8 rounded-full bg-recetario-bg flex items-center justify-center hover:bg-recetario-border transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-recetario-muted" />
                    </button>
                  )}
                  {item.status === "done" && item.recipeId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/recetario/receta/${item.recipeId}`)}
                      className="text-recetario-primary text-xs flex-shrink-0"
                    >
                      Ver
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress summary */}
          {processing && (
            <div className="bg-recetario-card rounded-2xl p-4 border border-recetario-border mb-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-recetario-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-recetario-fg font-body">
                Procesando recetas... {doneCount + errorCount}/{files.length}
              </p>
              <p className="text-xs text-recetario-muted-light mt-1 font-body">
                No cierres esta página. La IA está digitalizando tus recetas una a una.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {files.length > 0 && !processing && (
            <div className="flex gap-3">
              {pendingCount > 0 && (
                <Button
                  onClick={handleSubmitAll}
                  className="flex-1 h-12 bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-base font-medium shadow-lg shadow-recetario-primary/20"
                >
                  Digitalizar {pendingCount === 1 ? "receta" : `${pendingCount} recetas`}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              {singleDone && (
                <Button
                  onClick={() => navigate(`/recetario/receta/${files[0].recipeId}`)}
                  className="flex-1 h-12 bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-base font-medium shadow-lg shadow-recetario-primary/20"
                >
                  Ver receta
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              {doneCount > 1 && pendingCount === 0 && (
                <Button
                  onClick={() => navigate("/recetario/biblioteca")}
                  className="flex-1 h-12 bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-base font-medium shadow-lg shadow-recetario-primary/20"
                >
                  Ir a mi biblioteca
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
