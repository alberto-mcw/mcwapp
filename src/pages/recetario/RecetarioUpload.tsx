import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Upload, Image, X, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function RecetarioUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const leadId = sessionStorage.getItem("recetario_lead_id");
  const email = sessionStorage.getItem("recetario_email");

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error("Formato no válido. Sube JPG, PNG, WebP o PDF.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error("La imagen es demasiado grande. Máximo 10MB.");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  if (!leadId || !email) {
    navigate("/recetario");
    return null;
  }

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${leadId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      const recipeId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from("recipes")
        .insert({
          id: recipeId,
          lead_id: leadId,
          original_image_url: imageUrl,
          status: "processing",
        });

      if (insertError) throw insertError;

      const { data: result, error: fnError } = await supabase.functions.invoke("process-recipe", {
        body: { imageUrl, recipeId, action: "full-process" },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      toast.success("¡Receta digitalizada con éxito!");
      navigate(`/recetario/receta/${recipeId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al procesar la receta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen recetario-vichy-bg flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-recetario-primary" />
        <span className="font-display text-lg font-bold text-recetario-fg">El Recetario Eterno</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-lg">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-center text-recetario-fg mb-2">
            Sube tu receta manuscrita
          </h1>
          <p className="text-center text-recetario-muted text-sm mb-8 font-body">
            Haz una foto o sube la imagen de la receta que quieres preservar.
          </p>

          {/* Drop zone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-recetario-primary bg-recetario-primary/5"
                  : "border-recetario-primary/30 bg-recetario-card hover:border-recetario-primary/50 hover:bg-recetario-bg"
              }`}
            >
              <div className="w-16 h-16 bg-recetario-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-recetario-primary" />
              </div>
              <p className="font-display text-lg font-bold text-recetario-fg mb-1">
                Arrastra tu imagen aquí
              </p>
              <p className="text-sm text-recetario-muted-light font-body">
                o haz clic para seleccionar · JPG, PNG, WebP o PDF · Máx. 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          ) : (
            <div className="bg-recetario-card rounded-3xl p-6 border border-recetario-border shadow-lg">
              {/* Preview */}
              <div className="relative mb-6">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-80 object-contain rounded-2xl bg-recetario-bg"
                  />
                ) : (
                  <div className="w-full h-40 bg-recetario-bg rounded-2xl flex items-center justify-center">
                    <Image className="w-8 h-8 text-recetario-muted-light" />
                    <span className="ml-2 text-sm text-recetario-muted-light font-body">{file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-recetario-fg/70 text-white rounded-full flex items-center justify-center hover:bg-recetario-fg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-12 bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-base font-medium shadow-lg shadow-recetario-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Digitalizando con IA...
                  </>
                ) : (
                  <>
                    Digitalizar receta
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {loading && (
                <p className="text-center text-xs text-recetario-muted-light mt-4 font-body">
                  Esto puede tardar unos segundos. La IA está leyendo e interpretando tu receta...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
