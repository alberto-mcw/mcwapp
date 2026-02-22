import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Image, X, Loader2, ArrowRight, CheckCircle2, AlertCircle, Type, Mic, Square, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm", "audio/ogg", "audio/x-m4a"];

type FileItem = {
  id: string;
  file: File;
  preview: string | null;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  recipeId?: string;
  error?: string;
};

type TextItem = {
  id: string;
  text: string;
  status: "pending" | "processing" | "done" | "error";
  recipeId?: string;
  error?: string;
};

type AudioItem = {
  id: string;
  blob: Blob;
  fileName: string;
  status: "pending" | "uploading" | "transcribing" | "processing" | "done" | "error";
  recipeId?: string;
  error?: string;
};

export default function RecetarioUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
  const [textInput, setTextInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer for recording
  useEffect(() => {
    if (recording) {
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingSeconds(0);
    }
    return () => { if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current); };
  }, [recording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const leadId = sessionStorage.getItem("recetario_lead_id");
  const email = sessionStorage.getItem("recetario_email");

  // ── File handling ──
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const items: FileItem[] = [];
    Array.from(newFiles).forEach((f) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
        toast.error(`${f.name}: formato no válido.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: demasiado grande (máx. 10MB).`);
        return;
      }
      const item: FileItem = { id: crypto.randomUUID(), file: f, preview: null, status: "pending" };
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) => prev.map((p) => (p.id === item.id ? { ...p, preview: e.target?.result as string } : p)));
        };
        reader.readAsDataURL(f);
      }
      items.push(item);
    });
    if (items.length > 0) setFiles((prev) => [...prev, ...items]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // ── Text handling ──
  const addTextRecipe = () => {
    const trimmed = textInput.trim();
    if (!trimmed) { toast.error("Escribe una receta primero."); return; }
    setTextItems((prev) => [...prev, { id: crypto.randomUUID(), text: trimmed, status: "pending" }]);
    setTextInput("");
  };
  const removeTextItem = (id: string) => setTextItems((prev) => prev.filter((t) => t.id !== id));

  // ── Audio handling ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioItems((prev) => [
          ...prev,
          { id: crypto.randomUUID(), blob, fileName: `grabacion-${Date.now()}.webm`, status: "pending" },
        ]);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      toast.error("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const addAudioFiles = (fileList: FileList | File[]) => {
    Array.from(fileList).forEach((f) => {
      if (!ACCEPTED_AUDIO_TYPES.includes(f.type)) { toast.error(`${f.name}: formato de audio no válido.`); return; }
      if (f.size > MAX_FILE_SIZE) { toast.error(`${f.name}: demasiado grande (máx. 10MB).`); return; }
      setAudioItems((prev) => [...prev, { id: crypto.randomUUID(), blob: f, fileName: f.name, status: "pending" }]);
    });
  };
  const removeAudioItem = (id: string) => setAudioItems((prev) => prev.filter((a) => a.id !== id));

  // ── Guard ──
  if (!leadId || !email) { navigate("/recetario"); return null; }

  // ── Counts ──
  const allItems = [
    ...files.map((f) => ({ status: f.status, recipeId: f.recipeId })),
    ...textItems.map((t) => ({ status: t.status, recipeId: t.recipeId })),
    ...audioItems.map((a) => ({ status: a.status, recipeId: a.recipeId })),
  ];
  const pendingCount = allItems.filter((i) => i.status === "pending").length;
  const doneCount = allItems.filter((i) => i.status === "done").length;
  const errorCount = allItems.filter((i) => i.status === "error").length;
  const totalCount = allItems.length;

  // ── Process functions ──
  const processFile = async (item: FileItem): Promise<FileItem> => {
    setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" as const } : f)));
    try {
      const ext = item.file.name.split(".").pop() || "jpg";
      const fileName = `${leadId}/${Date.now()}-${item.id.slice(0, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("recipe-images").upload(fileName, item.file, { contentType: item.file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;
      const recipeId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("recipes").insert({ id: recipeId, lead_id: leadId, original_image_url: imageUrl, status: "processing" });
      if (insertError) throw insertError;
      setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "processing" as const, recipeId } : f)));
      const { data: result, error: fnError } = await supabase.functions.invoke("process-recipe", { body: { imageUrl, recipeId, action: "full-process" } });
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      return { ...item, status: "done", recipeId };
    } catch (err: any) {
      console.error(err);
      return { ...item, status: "error", error: err.message || "Error al procesar" };
    }
  };

  const processTextItem = async (item: TextItem): Promise<TextItem> => {
    setTextItems((prev) => prev.map((t) => (t.id === item.id ? { ...t, status: "processing" as const } : t)));
    try {
      const recipeId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("recipes").insert({ id: recipeId, lead_id: leadId, ocr_text: item.text, status: "processing" });
      if (insertError) throw insertError;
      const { data: result, error: fnError } = await supabase.functions.invoke("process-recipe", { body: { recipeText: item.text, recipeId, action: "full-process-text" } });
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      return { ...item, status: "done", recipeId };
    } catch (err: any) {
      console.error(err);
      return { ...item, status: "error", error: err.message || "Error al procesar" };
    }
  };

  const processAudioItem = async (item: AudioItem): Promise<AudioItem> => {
    setAudioItems((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: "uploading" as const } : a)));
    try {
      const ext = item.fileName.split(".").pop() || "webm";
      const fileName = `${leadId}/audio-${Date.now()}-${item.id.slice(0, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("recipe-images").upload(fileName, item.blob, { contentType: item.blob.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
      const audioUrl = urlData.publicUrl;

      // Transcribe + process in one call via process-recipe
      setAudioItems((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: "transcribing" as const } : a)));
      const recipeId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("recipes").insert({ id: recipeId, lead_id: leadId, status: "processing" });
      if (insertError) throw insertError;
      setAudioItems((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: "processing" as const, recipeId } : a)));
      const { data: result, error: fnError } = await supabase.functions.invoke("process-recipe", { body: { audioUrl, recipeId, action: "full-process-audio" } });
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

    for (const item of files.filter((f) => f.status === "pending")) {
      const result = await processFile(item);
      setFiles((prev) => prev.map((f) => (f.id === item.id ? result : f)));
    }
    for (const item of textItems.filter((t) => t.status === "pending")) {
      const result = await processTextItem(item);
      setTextItems((prev) => prev.map((t) => (t.id === item.id ? result : t)));
    }
    for (const item of audioItems.filter((a) => a.status === "pending")) {
      const result = await processAudioItem(item);
      setAudioItems((prev) => prev.map((a) => (a.id === item.id ? result : a)));
    }

    setProcessing(false);
    toast.success("¡Proceso completado!");
  };

  const singleDone = totalCount === 1 && doneCount === 1;
  const singleRecipeId = singleDone
    ? files.find((f) => f.status === "done")?.recipeId ||
      textItems.find((t) => t.status === "done")?.recipeId ||
      audioItems.find((a) => a.status === "done")?.recipeId
    : undefined;

  const statusLabel = (status: string, extra?: string) => {
    if (status === "uploading") return <span className="text-xs text-recetario-primary font-body flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Subiendo...</span>;
    if (status === "transcribing") return <span className="text-xs text-recetario-primary font-body flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Transcribiendo...</span>;
    if (status === "processing") return <span className="text-xs text-recetario-primary font-body flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Digitalizando con IA...</span>;
    if (status === "done") return <span className="text-xs text-green-600 font-body flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completada</span>;
    if (status === "error") return <span className="text-xs text-destructive font-body flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {extra}</span>;
    return null;
  };

  return (
    <div className="min-h-screen recetario-vichy-bg flex flex-col">
      <header className="px-6 py-0 flex items-center gap-2">
        <img src="/images/recetario-logo.png" alt="Mi Recetario Eterno" className="h-56 sm:h-64 -my-[50px]" />
      </header>

      <div className="flex-1 flex items-start justify-center px-6 pb-12 pt-4">
        <div className="w-full max-w-2xl">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-center text-recetario-fg mb-2">
            Sube tus recetas
          </h1>
          <p className="text-center text-recetario-muted text-sm mb-8 font-body">
            Foto, texto o audio — la IA las digitalizará todas.
          </p>

          {/* ── Image drop zone ── */}
          {!processing && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all mb-4 ${
                dragOver ? "border-recetario-primary bg-recetario-primary/5" : "border-recetario-primary/30 bg-recetario-card hover:border-recetario-primary/50 hover:bg-recetario-bg"
              }`}
            >
              <div className="w-12 h-12 bg-recetario-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5 text-recetario-primary" />
              </div>
              <p className="font-display text-sm font-bold text-recetario-fg mb-1">
                {files.length === 0 ? "Arrastra fotos de recetas aquí" : "Añadir más fotos"}
              </p>
              <p className="text-xs text-recetario-muted-light font-body">JPG, PNG, WebP o PDF · Máx. 10MB</p>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
            </div>
          )}

          {/* ── Text input ── */}
          {!processing && (
            <div className="bg-recetario-card rounded-3xl p-4 border border-recetario-border mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-recetario-primary/10 rounded-xl flex items-center justify-center">
                  <Type className="w-4 h-4 text-recetario-primary" />
                </div>
                <p className="font-display text-sm font-bold text-recetario-fg">Escribe o pega una receta</p>
              </div>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Escribe los ingredientes y los pasos de tu receta aquí..."
                className="min-h-[100px] bg-recetario-bg border-recetario-border rounded-2xl text-sm font-body resize-none mb-2"
              />
              <Button
                onClick={addTextRecipe}
                disabled={!textInput.trim()}
                size="sm"
                className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-xs"
              >
                Añadir receta de texto
              </Button>
            </div>
          )}

          {/* ── Audio input ── */}
          {!processing && (
            <div className="bg-recetario-card rounded-3xl p-4 border border-recetario-border mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-recetario-primary/10 rounded-xl flex items-center justify-center">
                  <Mic className="w-4 h-4 text-recetario-primary" />
                </div>
                <p className="font-display text-sm font-bold text-recetario-fg">Dicta o sube un audio</p>
              </div>
              <div className="flex gap-2">
                {!recording ? (
                  <Button onClick={startRecording} size="sm" variant="outline" className="rounded-full text-xs border-recetario-border text-recetario-fg">
                    <Mic className="w-3.5 h-3.5 mr-1" /> Grabar
                  </Button>
                ) : (
                  <>
                    <Button onClick={stopRecording} size="sm" className="rounded-full text-xs bg-destructive hover:bg-destructive/90 text-white animate-pulse">
                      <Square className="w-3.5 h-3.5 mr-1" /> Parar
                    </Button>
                    <span className="text-xs font-mono text-destructive flex items-center">{formatTime(recordingSeconds)}</span>
                  </>
                )}
                <Button onClick={() => audioInputRef.current?.click()} size="sm" variant="outline" className="rounded-full text-xs border-recetario-border text-recetario-fg">
                  <FileAudio className="w-3.5 h-3.5 mr-1" /> Subir archivo
                </Button>
                <input ref={audioInputRef} type="file" accept=".mp3,.wav,.m4a,.webm,.ogg" multiple className="hidden" onChange={(e) => { if (e.target.files) addAudioFiles(e.target.files); e.target.value = ""; }} />
              </div>
            </div>
          )}

          {/* ── Item list ── */}
          {(files.length > 0 || textItems.length > 0 || audioItems.length > 0) && (
            <div className="space-y-3 mb-6">
              {files.map((item) => (
                <div key={item.id} className="bg-recetario-card rounded-2xl p-3 border border-recetario-border flex items-center gap-3 shadow-sm">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-recetario-bg flex-shrink-0 flex items-center justify-center">
                    {item.preview ? <img src={item.preview} alt="Preview" className="w-full h-full object-cover" /> : <Image className="w-5 h-5 text-recetario-muted-light" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-recetario-fg truncate font-body">{item.file.name}</p>
                    <p className="text-xs text-recetario-muted-light font-body">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    {statusLabel(item.status, item.error)}
                  </div>
                  {item.status === "pending" && !processing && (
                    <button onClick={() => removeFile(item.id)} className="w-8 h-8 rounded-full bg-recetario-bg flex items-center justify-center hover:bg-recetario-border transition-colors flex-shrink-0"><X className="w-4 h-4 text-recetario-muted" /></button>
                  )}
                  {item.status === "done" && item.recipeId && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/recetario/receta/${item.recipeId}`)} className="text-recetario-primary text-xs flex-shrink-0">Ver</Button>
                  )}
                </div>
              ))}

              {textItems.map((item) => (
                <div key={item.id} className="bg-recetario-card rounded-2xl p-3 border border-recetario-border flex items-center gap-3 shadow-sm">
                  <div className="w-14 h-14 rounded-xl bg-recetario-bg flex-shrink-0 flex items-center justify-center">
                    <Type className="w-5 h-5 text-recetario-muted-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-recetario-fg truncate font-body">{item.text.slice(0, 60)}…</p>
                    <p className="text-xs text-recetario-muted-light font-body">Receta de texto</p>
                    {statusLabel(item.status, item.error)}
                  </div>
                  {item.status === "pending" && !processing && (
                    <button onClick={() => removeTextItem(item.id)} className="w-8 h-8 rounded-full bg-recetario-bg flex items-center justify-center hover:bg-recetario-border transition-colors flex-shrink-0"><X className="w-4 h-4 text-recetario-muted" /></button>
                  )}
                  {item.status === "done" && item.recipeId && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/recetario/receta/${item.recipeId}`)} className="text-recetario-primary text-xs flex-shrink-0">Ver</Button>
                  )}
                </div>
              ))}

              {audioItems.map((item) => (
                <div key={item.id} className="bg-recetario-card rounded-2xl p-3 border border-recetario-border flex items-center gap-3 shadow-sm">
                  <div className="w-14 h-14 rounded-xl bg-recetario-bg flex-shrink-0 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-recetario-muted-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-recetario-fg truncate font-body">{item.fileName}</p>
                    <p className="text-xs text-recetario-muted-light font-body">Audio</p>
                    {statusLabel(item.status, item.error)}
                  </div>
                  {item.status === "pending" && !processing && (
                    <button onClick={() => removeAudioItem(item.id)} className="w-8 h-8 rounded-full bg-recetario-bg flex items-center justify-center hover:bg-recetario-border transition-colors flex-shrink-0"><X className="w-4 h-4 text-recetario-muted" /></button>
                  )}
                  {item.status === "done" && item.recipeId && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/recetario/receta/${item.recipeId}`)} className="text-recetario-primary text-xs flex-shrink-0">Ver</Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Progress ── */}
          {processing && (
            <div className="bg-recetario-card rounded-2xl p-4 border border-recetario-border mb-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-recetario-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-recetario-fg font-body">
                Procesando recetas... {doneCount + errorCount}/{totalCount}
              </p>
              <p className="text-xs text-recetario-muted-light mt-1 font-body">No cierres esta página.</p>
            </div>
          )}

          {/* ── Action buttons ── */}
          {totalCount > 0 && !processing && (
            <div className="flex gap-3">
              {pendingCount > 0 && (
                <Button onClick={handleSubmitAll} className="flex-1 h-12 bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-base font-medium shadow-lg shadow-recetario-primary/20">
                  Digitalizar {pendingCount === 1 ? "receta" : `${pendingCount} recetas`}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              {singleDone && singleRecipeId && (
                <Button onClick={() => navigate(`/recetario/receta/${singleRecipeId}`)} className="flex-1 h-12 bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-base font-medium shadow-lg shadow-recetario-primary/20">
                  Ver receta <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              {doneCount > 1 && pendingCount === 0 && (
                <Button onClick={() => navigate("/recetario/biblioteca")} className="flex-1 h-12 bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-base font-medium shadow-lg shadow-recetario-primary/20">
                  Ir a mi biblioteca <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
