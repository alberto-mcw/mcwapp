import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen, ChefHat, Clock, Users, Flame, ShoppingCart,
  Leaf, ArrowLeft, Download, Share2, Loader2, ChevronDown, ChevronUp, Copy, Check,
  Pencil, Save, X, ImagePlus, Trash2, Plus, Upload, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Ingredient {
  nombre: string;
  cantidad: number;
  unidad: string;
  categoria?: string;
}

interface RecipeData {
  titulo: string;
  ingredientes: Ingredient[];
  pasos: string[];
  tiempo_estimado: string;
  dificultad: string;
  tipo_receta: string;
  estilo_regional?: string;
  raciones: number;
  calorias_por_racion?: number;
  historia_emocional?: string;
  consejo_final?: string;
  generated_image_url?: string;
}

interface Alternative {
  ingrediente_original: string;
  alternativa_saludable: string;
  alternativa_economica: string;
  alternativa_tradicional: string;
}

interface HealthyVersion {
  ingredientes: Array<{ nombre: string; cantidad: number; unidad: string; cambio?: string }>;
  pasos: string[];
  calorias_por_racion: number;
  resumen_cambios: string;
}

const SERVINGS_OPTIONS = [2, 4, 6, 8];

const categoryLabels: Record<string, string> = {
  verduras: "🥬 Verduras",
  carnes_pescados: "🥩 Carnes y pescados",
  lacteos: "🧀 Lácteos",
  despensa: "🫙 Despensa",
  otros: "📦 Otros",
};

export default function RecetarioResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(4);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showHealthy, setShowHealthy] = useState(false);
  const [loadingHealthy, setLoadingHealthy] = useState(false);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [loadingServings, setLoadingServings] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  // Image
  const [loadingImage, setLoadingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<RecipeData | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    if (!id) return;
    const leadId = sessionStorage.getItem("recetario_lead_id");
    const leadEmail = sessionStorage.getItem("recetario_email");

    // Check if user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();

    let data: any = null;
    let error: any = null;

    if (authUser) {
      // Authenticated: direct query (RLS allows owner access)
      const result = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      data = result.data;
      error = result.error;
    } else if (leadId && leadEmail) {
      // Anonymous lead: use secure RPC
      const result = await supabase.rpc('get_lead_recipe_by_id', { p_recipe_id: id, p_lead_id: leadId, p_email: leadEmail });
      data = result.data?.[0] || null;
      error = result.error;
    }

    if (error || !data) {
      toast.error("Receta no encontrada");
      navigate("/recetario");
      return;
    }
    setRecipe(data);
    setServings(data.servings || 4);
    setLoading(false);
  };

  const recipeData = recipe?.structured_data as RecipeData | null;
  const shoppingList = recipe?.shopping_list as Record<string, any[]> | null;
  const alternatives = recipe?.alternatives as { alternativas: Alternative[] } | null;
  const healthyVersion = recipe?.healthy_version as HealthyVersion | null;

  const trackInteraction = async (actionType: string, actionData?: any) => {
    const leadId = sessionStorage.getItem("recetario_lead_id");
    await supabase.from("recipe_interactions").insert({
      recipe_id: id,
      lead_id: leadId,
      action_type: actionType,
      action_data: actionData,
    });
  };

  // --- Edit mode handlers ---
  const startEditing = () => {
    if (recipeData) {
      setEditData(JSON.parse(JSON.stringify(recipeData)));
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const saveEdits = async () => {
    if (!editData || !id) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase.functions.invoke("process-recipe", {
        body: { recipeId: id, recipeData: editData, action: "update-recipe" },
      });
      if (error) throw error;
      await loadRecipe();
      setIsEditing(false);
      setEditData(null);
      toast.success("¡Receta actualizada!");
      trackInteraction("receta_editada");
    } catch {
      toast.error("Error al guardar cambios");
    } finally {
      setSavingEdit(false);
    }
  };

  const updateEditField = (field: string, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    if (!editData) return;
    const newIngs = [...editData.ingredientes];
    newIngs[index] = { ...newIngs[index], [field]: field === "cantidad" ? parseFloat(value) || 0 : value };
    setEditData({ ...editData, ingredientes: newIngs });
  };

  const removeIngredient = (index: number) => {
    if (!editData) return;
    setEditData({ ...editData, ingredientes: editData.ingredientes.filter((_, i) => i !== index) });
  };

  const addIngredient = () => {
    if (!editData) return;
    setEditData({
      ...editData,
      ingredientes: [...editData.ingredientes, { nombre: "", cantidad: 0, unidad: "g", categoria: "otros" }],
    });
  };

  const updateStep = (index: number, value: string) => {
    if (!editData) return;
    const newSteps = [...editData.pasos];
    newSteps[index] = value;
    setEditData({ ...editData, pasos: newSteps });
  };

  const removeStep = (index: number) => {
    if (!editData) return;
    setEditData({ ...editData, pasos: editData.pasos.filter((_, i) => i !== index) });
  };

  const addStep = () => {
    if (!editData) return;
    setEditData({ ...editData, pasos: [...editData.pasos, ""] });
  };

  // --- Image generation ---
  const handleGenerateImage = async () => {
    if (!id) return;
    setLoadingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-recipe", {
        body: { recipeId: id, action: "generate-image" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await loadRecipe();
      toast.success("¡Imagen generada!");
      trackInteraction("imagen_generada");
    } catch (e: any) {
      toast.error(e?.message || "Error al generar imagen");
    } finally {
      setLoadingImage(false);
    }
  };

  // --- Image upload ---
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `uploaded/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(filePath, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage.from("recipe-images").getPublicUrl(filePath);
      const { data: currentRecipe } = await supabase.from("recipes").select("structured_data").eq("id", id).maybeSingle();
      if (currentRecipe) {
        const updatedData = { ...(currentRecipe.structured_data as Record<string, any>), generated_image_url: publicUrl.publicUrl };
        await supabase.from("recipes").update({ structured_data: updatedData }).eq("id", id);
      }
      await loadRecipe();
      toast.success("¡Foto subida!");
      trackInteraction("imagen_subida");
    } catch {
      toast.error("Error al subir la foto");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleServingsChange = async (newServings: number) => {
    if (newServings === servings) return;
    setLoadingServings(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-recipe", {
        body: { recipeId: id, servings: newServings, action: "adjust-servings" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setServings(newServings);
      await loadRecipe();
      trackInteraction("cambio_raciones", { servings: newServings });
    } catch {
      toast.error("Error al ajustar raciones");
    } finally {
      setLoadingServings(false);
    }
  };

  const handleHealthy = async () => {
    if (healthyVersion) {
      setShowHealthy(!showHealthy);
      return;
    }
    setLoadingHealthy(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-recipe", {
        body: { recipeId: id, action: "healthy" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await loadRecipe();
      setShowHealthy(true);
      trackInteraction("version_saludable_activada");
    } catch {
      toast.error("Error al generar versión saludable");
    } finally {
      setLoadingHealthy(false);
    }
  };

  const handleAlternatives = async () => {
    if (alternatives) {
      setShowAlternatives(!showAlternatives);
      return;
    }
    setLoadingAlts(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-recipe", {
        body: { recipeId: id, action: "alternatives" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await loadRecipe();
      setShowAlternatives(true);
      trackInteraction("alternativas_consultadas");
    } catch {
      toast.error("Error al generar alternativas");
    } finally {
      setLoadingAlts(false);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    let token = recipe.share_token;
    if (!token) {
      token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      await supabase.from("recipes").update({ share_token: token, visibility: "shared" }).eq("id", id);
      await supabase.from("recipe_shares").insert({ recipe_id: id!, share_token: token });
      setRecipe({ ...recipe, share_token: token, visibility: "shared" });
    }
    const url = `${window.location.origin}/recetario/compartida/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("¡Enlace copiado!");
    trackInteraction("compartida");
  };

  const generatePDF = async () => {
    if (!recipeData) return;
    setLoadingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const email = sessionStorage.getItem("recetario_email") || "Chef";
      const w = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentW = w - margin * 2;
      let y = 0;

      doc.setFillColor(255, 248, 240);
      doc.rect(0, 0, w, doc.internal.pageSize.getHeight(), "F");
      
      doc.setFontSize(14);
      doc.setTextColor(139, 115, 85);
      doc.text("EL RECETARIO ETERNO", w / 2, 60, { align: "center" });

      doc.setFontSize(32);
      doc.setTextColor(61, 43, 31);
      doc.text(recipeData.titulo, w / 2, 90, { align: "center", maxWidth: contentW });

      doc.setFontSize(12);
      doc.setTextColor(139, 115, 85);
      doc.text(`El Recetario de ${email.split("@")[0]}`, w / 2, 120, { align: "center" });
      doc.text("Edición 2026", w / 2, 130, { align: "center" });

      if (recipeData.historia_emocional) {
        doc.setFontSize(10);
        doc.setTextColor(107, 87, 68);
        const storyLines = doc.splitTextToSize(recipeData.historia_emocional, contentW - 20);
        doc.text(storyLines, w / 2, 160, { align: "center" });
      }

      doc.addPage();
      doc.setFillColor(255, 248, 240);
      doc.rect(0, 0, w, doc.internal.pageSize.getHeight(), "F");
      y = 25;

      doc.setFontSize(22);
      doc.setTextColor(61, 43, 31);
      doc.text(recipeData.titulo, margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(139, 115, 85);
      doc.text(`⏱ ${recipeData.tiempo_estimado || "N/A"}  ·  ${recipeData.dificultad}  ·  ${servings} personas`, margin, y);
      if (recipeData.calorias_por_racion) {
        doc.text(`  ·  ~${recipeData.calorias_por_racion} kcal/ración`, margin + 80, y);
      }
      y += 12;

      doc.setFontSize(14);
      doc.setTextColor(199, 91, 42);
      doc.text("Ingredientes", margin, y);
      y += 7;

      doc.setFontSize(10);
      doc.setTextColor(61, 43, 31);
      for (const ing of recipeData.ingredientes) {
        if (y > 270) { doc.addPage(); y = 25; }
        doc.text(`•  ${ing.cantidad} ${ing.unidad} de ${ing.nombre}`, margin + 2, y);
        y += 5;
      }
      y += 5;

      doc.setFontSize(14);
      doc.setTextColor(199, 91, 42);
      doc.text("Preparación", margin, y);
      y += 7;

      doc.setFontSize(10);
      doc.setTextColor(61, 43, 31);
      recipeData.pasos.forEach((step, i) => {
        if (y > 260) { doc.addPage(); y = 25; }
        const lines = doc.splitTextToSize(`${i + 1}. ${step}`, contentW);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 3;
      });

      if (shoppingList) {
        y += 5;
        if (y > 240) { doc.addPage(); y = 25; }
        doc.setFontSize(14);
        doc.setTextColor(199, 91, 42);
        doc.text("Lista de la compra", margin, y);
        y += 7;

        doc.setFontSize(10);
        for (const [cat, items] of Object.entries(shoppingList)) {
          if (!items || items.length === 0) continue;
          if (y > 260) { doc.addPage(); y = 25; }
          doc.setTextColor(139, 115, 85);
          doc.text(categoryLabels[cat] || cat, margin, y);
          y += 5;
          doc.setTextColor(61, 43, 31);
          for (const item of items) {
            if (y > 270) { doc.addPage(); y = 25; }
            doc.text(`☐  ${item.cantidad} ${item.unidad} ${item.nombre}`, margin + 4, y);
            y += 5;
          }
          y += 3;
        }
      }

      if (healthyVersion && recipe.healthy_version_active) {
        doc.addPage();
        doc.setFillColor(255, 248, 240);
        doc.rect(0, 0, w, doc.internal.pageSize.getHeight(), "F");
        y = 25;
        doc.setFontSize(14);
        doc.setTextColor(85, 130, 80);
        doc.text("Versión saludable", margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(61, 43, 31);
        const resLines = doc.splitTextToSize(healthyVersion.resumen_cambios, contentW);
        doc.text(resLines, margin, y);
        y += resLines.length * 5 + 5;
        doc.text(`~${healthyVersion.calorias_por_racion} kcal/ración`, margin, y);
      }

      if (recipeData.consejo_final) {
        y += 15;
        if (y > 250) { doc.addPage(); y = 25; }
        doc.setFontSize(10);
        doc.setTextColor(199, 91, 42);
        doc.text("💡 Consejo de la abuela:", margin, y);
        y += 6;
        doc.setTextColor(107, 87, 68);
        const tipLines = doc.splitTextToSize(recipeData.consejo_final, contentW);
        doc.text(tipLines, margin, y);
      }

      doc.save(`${recipeData.titulo.replace(/\s+/g, "_")}_receta.pdf`);
      trackInteraction("descarga_pdf");
      toast.success("¡PDF descargado!");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar PDF");
    } finally {
      setLoadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen recetario-vichy-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-recetario-primary" />
      </div>
    );
  }

  if (!recipeData) {
    return (
      <div className="min-h-screen recetario-vichy-bg flex items-center justify-center">
        <p className="text-recetario-muted font-body">Receta no encontrada o en procesamiento...</p>
      </div>
    );
  }

  const displayData = isEditing && editData ? editData : recipeData;

  return (
    <div className="min-h-screen recetario-vichy-bg">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/images/recetario-logo.png" alt="Mi Recetario Eterno" className="h-56 sm:h-64 -my-[50px]" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/recetario/biblioteca")} className="text-recetario-primary">
          Mi Biblioteca
        </Button>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {/* Back */}
        <button onClick={() => navigate("/recetario/subir")} className="flex items-center gap-1 text-sm text-recetario-muted-light mb-6 hover:text-recetario-primary transition-colors font-body">
          <ArrowLeft className="w-4 h-4" /> Nueva receta
        </button>

        {/* Recipe Image */}
        <div className="mb-6">
          {recipeData.generated_image_url ? (
            <div className="relative rounded-2xl overflow-hidden border border-recetario-border">
              <img
                src={recipeData.generated_image_url}
                alt={recipeData.titulo}
                className="w-full h-56 md:h-72 object-cover"
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <label className="bg-recetario-card/90 backdrop-blur-sm text-recetario-fg text-xs px-3 py-1.5 rounded-full border border-recetario-border flex items-center gap-1.5 hover:bg-recetario-card transition-all cursor-pointer">
                  {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Subir foto
                  <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" disabled={uploadingImage} />
                </label>
                <button
                  onClick={handleGenerateImage}
                  disabled={loadingImage}
                  className="bg-recetario-card/90 backdrop-blur-sm text-recetario-fg text-xs px-3 py-1.5 rounded-full border border-recetario-border flex items-center gap-1.5 hover:bg-recetario-card transition-all"
                >
                  {loadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Regenerar IA
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl border-2 border-dashed border-recetario-border bg-recetario-surface/50 p-6">
              {loadingImage || uploadingImage ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-recetario-primary" />
                  <span className="text-sm text-recetario-muted font-body">
                    {loadingImage ? "Generando imagen con IA..." : "Subiendo foto..."}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                  <label className="flex-1 w-full sm:w-auto flex flex-col items-center gap-2 py-5 px-4 rounded-xl bg-recetario-card border border-recetario-border cursor-pointer hover:bg-recetario-bg transition-all">
                    <Upload className="w-6 h-6 text-recetario-primary" />
                    <span className="text-sm font-medium text-recetario-fg font-body">Subir foto</span>
                    <span className="text-xs text-recetario-muted-light font-body">JPG, PNG, WebP</span>
                    <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                  </label>
                  <span className="text-xs text-recetario-muted-light font-body">o</span>
                  <button
                    onClick={handleGenerateImage}
                    className="flex-1 w-full sm:w-auto flex flex-col items-center gap-2 py-5 px-4 rounded-xl bg-recetario-card border border-recetario-border hover:bg-recetario-bg transition-all"
                  >
                    <Sparkles className="w-6 h-6 text-recetario-primary" />
                    <span className="text-sm font-medium text-recetario-fg font-body">Generar con IA</span>
                    <span className="text-xs text-recetario-muted-light font-body">Imagen automática</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit toggle */}
        <div className="flex justify-end mb-4">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEditing}
                className="rounded-full border-recetario-border text-recetario-muted"
              >
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button
                size="sm"
                onClick={saveEdits}
                disabled={savingEdit}
                className="rounded-full bg-recetario-primary hover:bg-recetario-primary-hover text-white"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Guardar
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={startEditing}
              className="rounded-full border-recetario-border text-recetario-muted hover:text-recetario-primary hover:border-recetario-primary"
            >
              <Pencil className="w-4 h-4 mr-1" /> Editar receta
            </Button>
          )}
        </div>

        {/* Story */}
        {displayData.historia_emocional && (
          <div className="bg-recetario-surface rounded-2xl p-6 mb-6 border border-recetario-border">
            {isEditing ? (
              <textarea
                value={editData?.historia_emocional || ""}
                onChange={(e) => updateEditField("historia_emocional", e.target.value)}
                className="w-full bg-transparent text-sm text-recetario-muted italic font-body resize-none outline-none min-h-[60px]"
              />
            ) : (
              <p className="font-display italic text-recetario-muted text-sm leading-relaxed">{displayData.historia_emocional}</p>
            )}
          </div>
        )}

        {/* Title & meta */}
        {isEditing ? (
          <input
            value={editData?.titulo || ""}
            onChange={(e) => updateEditField("titulo", e.target.value)}
            className="font-display text-3xl md:text-4xl font-bold text-recetario-fg mb-3 w-full bg-transparent border-b-2 border-recetario-primary/30 outline-none pb-1"
          />
        ) : (
          <h1 className="font-display text-3xl md:text-4xl font-bold text-recetario-fg mb-3">{displayData.titulo}</h1>
        )}

        <div className="flex flex-wrap gap-3 mb-8 text-sm text-recetario-muted font-body">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{displayData.tiempo_estimado}</span>
          <span className="flex items-center gap-1"><Flame className="w-4 h-4" />{displayData.dificultad}</span>
          <span className="flex items-center gap-1"><ChefHat className="w-4 h-4" />{displayData.tipo_receta}</span>
          {displayData.calorias_por_racion && (
            <span className="flex items-center gap-1">🔥 ~{displayData.calorias_por_racion} kcal</span>
          )}
        </div>

        {/* Servings selector (not in edit mode) */}
        {!isEditing && (
          <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border mb-6">
            <p className="text-sm font-medium text-recetario-fg mb-3 font-body">
              <Users className="w-4 h-4 inline mr-1" /> Raciones
            </p>
            <div className="flex gap-2">
              {SERVINGS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleServingsChange(s)}
                  disabled={loadingServings}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                    servings === s
                      ? "bg-recetario-primary text-white shadow-md"
                      : "bg-recetario-bg text-recetario-muted hover:bg-recetario-surface"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {loadingServings && <p className="text-xs text-recetario-muted-light mt-2 text-center font-body">Recalculando...</p>}
          </div>
        )}

        {/* Ingredients */}
        <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border mb-6">
          <h2 className="font-display text-xl font-bold text-recetario-fg mb-4">Ingredientes</h2>
          {isEditing ? (
            <div className="space-y-2">
              {editData?.ingredientes.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ing.cantidad}
                    onChange={(e) => updateIngredient(i, "cantidad", e.target.value)}
                    className="w-16 text-sm bg-recetario-bg border border-recetario-border rounded-lg px-2 py-1.5 text-recetario-fg outline-none focus:border-recetario-primary"
                  />
                  <input
                    value={ing.unidad}
                    onChange={(e) => updateIngredient(i, "unidad", e.target.value)}
                    className="w-16 text-sm bg-recetario-bg border border-recetario-border rounded-lg px-2 py-1.5 text-recetario-fg outline-none focus:border-recetario-primary"
                  />
                  <input
                    value={ing.nombre}
                    onChange={(e) => updateIngredient(i, "nombre", e.target.value)}
                    className="flex-1 text-sm bg-recetario-bg border border-recetario-border rounded-lg px-2 py-1.5 text-recetario-fg outline-none focus:border-recetario-primary"
                  />
                  <button onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addIngredient}
                className="flex items-center gap-1 text-sm text-recetario-primary hover:text-recetario-primary-hover mt-2 font-body"
              >
                <Plus className="w-4 h-4" /> Añadir ingrediente
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {displayData.ingredientes.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-recetario-fg font-body">
                  <span className="w-1.5 h-1.5 rounded-full bg-recetario-primary flex-shrink-0" />
                  <span className="font-medium">{ing.cantidad} {ing.unidad}</span>
                  <span className="text-recetario-muted">{ing.nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Steps */}
        <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border mb-6">
          <h2 className="font-display text-xl font-bold text-recetario-fg mb-4">Preparación</h2>
          {isEditing ? (
            <div className="space-y-3">
              {editData?.pasos.map((paso, i) => (
                <div key={i} className="flex gap-2">
                  <span className="w-7 h-7 rounded-full bg-recetario-primary/10 text-recetario-primary flex items-center justify-center flex-shrink-0 text-sm font-bold font-display mt-1">
                    {i + 1}
                  </span>
                  <textarea
                    value={paso}
                    onChange={(e) => updateStep(i, e.target.value)}
                    className="flex-1 text-sm bg-recetario-bg border border-recetario-border rounded-lg px-3 py-2 text-recetario-fg outline-none focus:border-recetario-primary resize-none min-h-[40px] font-body"
                    rows={2}
                  />
                  <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 p-1 mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addStep}
                className="flex items-center gap-1 text-sm text-recetario-primary hover:text-recetario-primary-hover mt-2 font-body"
              >
                <Plus className="w-4 h-4" /> Añadir paso
              </button>
            </div>
          ) : (
            <ol className="space-y-4">
              {displayData.pasos.map((paso, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-recetario-primary/10 text-recetario-primary flex items-center justify-center flex-shrink-0 text-sm font-bold font-display">
                    {i + 1}
                  </span>
                  <p className="text-sm text-recetario-fg leading-relaxed pt-1 font-body">{paso}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Final tip */}
        {displayData.consejo_final && (
          <div className="bg-recetario-primary/5 rounded-2xl p-5 border border-recetario-primary/15 mb-6">
            <p className="text-sm text-recetario-primary font-medium mb-1">💡 Consejo de la abuela</p>
            {isEditing ? (
              <textarea
                value={editData?.consejo_final || ""}
                onChange={(e) => updateEditField("consejo_final", e.target.value)}
                className="w-full text-sm text-recetario-muted italic bg-transparent outline-none resize-none min-h-[40px] font-body"
              />
            ) : (
              <p className="text-sm text-recetario-muted italic font-body">{displayData.consejo_final}</p>
            )}
          </div>
        )}

        {/* Interactive features (hide in edit mode) */}
        {!isEditing && (
          <div className="space-y-3 mb-8">
            {/* Shopping list toggle */}
            <button
              onClick={() => setShowShoppingList(!showShoppingList)}
              className="w-full bg-recetario-card rounded-2xl p-4 border border-recetario-border flex items-center justify-between hover:bg-recetario-bg transition-all"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-recetario-fg font-body">
                <ShoppingCart className="w-5 h-5 text-recetario-primary" /> Lista de la compra
              </span>
              {showShoppingList ? <ChevronUp className="w-4 h-4 text-recetario-muted-light" /> : <ChevronDown className="w-4 h-4 text-recetario-muted-light" />}
            </button>
            {showShoppingList && shoppingList && (
              <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border">
                {Object.entries(shoppingList).map(([cat, items]) => {
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={cat} className="mb-4 last:mb-0">
                      <p className="text-sm font-medium text-recetario-primary mb-2 font-body">{categoryLabels[cat] || cat}</p>
                      {items.map((item: any, i: number) => (
                        <p key={i} className="text-sm text-recetario-fg ml-2 mb-1 font-body">
                          ☐ {item.cantidad} {item.unidad} {item.nombre}
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alternatives */}
            <button
              onClick={handleAlternatives}
              disabled={loadingAlts}
              className="w-full bg-recetario-card rounded-2xl p-4 border border-recetario-border flex items-center justify-between hover:bg-recetario-bg transition-all"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-recetario-fg font-body">
                {loadingAlts ? <Loader2 className="w-5 h-5 animate-spin text-recetario-primary" /> : <span className="text-lg">🔄</span>}
                Alternativas de ingredientes
              </span>
              {alternatives && (showAlternatives ? <ChevronUp className="w-4 h-4 text-recetario-muted-light" /> : <ChevronDown className="w-4 h-4 text-recetario-muted-light" />)}
            </button>
            {showAlternatives && alternatives?.alternativas && (
              <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border space-y-4">
                {alternatives.alternativas.map((alt, i) => (
                  <div key={i} className="text-sm font-body">
                    <p className="font-medium text-recetario-fg mb-1">{alt.ingrediente_original}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-recetario-healthy-bg rounded-lg p-2"><span className="block text-recetario-healthy font-medium mb-0.5">Saludable</span>{alt.alternativa_saludable}</div>
                      <div className="bg-recetario-primary/10 rounded-lg p-2"><span className="block text-recetario-primary font-medium mb-0.5">Económica</span>{alt.alternativa_economica}</div>
                      <div className="bg-recetario-surface rounded-lg p-2"><span className="block text-recetario-muted-light font-medium mb-0.5">Tradicional</span>{alt.alternativa_tradicional}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Healthy version */}
            <button
              onClick={handleHealthy}
              disabled={loadingHealthy}
              className="w-full bg-recetario-card rounded-2xl p-4 border border-recetario-border flex items-center justify-between hover:bg-recetario-bg transition-all"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-recetario-fg font-body">
                {loadingHealthy ? <Loader2 className="w-5 h-5 animate-spin text-recetario-healthy" /> : <Leaf className="w-5 h-5 text-recetario-healthy" />}
                Versión saludable
              </span>
              {healthyVersion && (showHealthy ? <ChevronUp className="w-4 h-4 text-recetario-muted-light" /> : <ChevronDown className="w-4 h-4 text-recetario-muted-light" />)}
            </button>
            {showHealthy && healthyVersion && (
              <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-healthy/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-recetario-healthy-bg text-recetario-healthy px-2 py-1 rounded-full font-medium">
                    ~{healthyVersion.calorias_por_racion} kcal/ración
                  </span>
                  {recipeData.calorias_por_racion && (
                    <span className="text-xs text-recetario-muted-light line-through">
                      {recipeData.calorias_por_racion} kcal
                    </span>
                  )}
                </div>
                <p className="text-sm text-recetario-healthy mb-4 italic font-body">{healthyVersion.resumen_cambios}</p>
                <h3 className="text-sm font-medium text-recetario-fg mb-2 font-body">Ingredientes adaptados:</h3>
                <ul className="space-y-1 mb-4">
                  {healthyVersion.ingredientes.map((ing, i) => (
                    <li key={i} className="text-sm text-recetario-fg font-body">
                      • {ing.cantidad} {ing.unidad} {ing.nombre}
                      {ing.cambio && <span className="text-xs text-recetario-healthy ml-1">({ing.cambio})</span>}
                    </li>
                  ))}
                </ul>
                <h3 className="text-sm font-medium text-recetario-fg mb-2 font-body">Pasos:</h3>
                <ol className="space-y-2">
                  {healthyVersion.pasos.map((p, i) => (
                    <li key={i} className="text-sm text-recetario-fg font-body">{i + 1}. {p}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!isEditing && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={generatePDF}
              disabled={loadingPdf}
              className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full h-12"
            >
              {loadingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Descargar PDF
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5 rounded-full h-12"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {copied ? "¡Copiado!" : "Compartir"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
