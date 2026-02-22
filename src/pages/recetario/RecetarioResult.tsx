import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen, ChefHat, Clock, Users, Flame, ShoppingCart, Heart,
  Leaf, ArrowLeft, Download, Share2, Loader2, ChevronDown, ChevronUp, Copy, Check
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

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

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

      // Cover page
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
      <div className="min-h-screen bg-recetario-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-recetario-primary" />
      </div>
    );
  }

  if (!recipeData) {
    return (
      <div className="min-h-screen bg-recetario-bg flex items-center justify-center">
        <p className="text-recetario-muted font-body">Receta no encontrada o en procesamiento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-recetario-bg">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-recetario-primary" />
          <span className="font-display text-lg font-bold text-recetario-fg">El Recetario Eterno</span>
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

        {/* Story */}
        {recipeData.historia_emocional && (
          <div className="bg-recetario-surface rounded-2xl p-6 mb-6 border border-recetario-border">
            <p className="font-display italic text-recetario-muted text-sm leading-relaxed">{recipeData.historia_emocional}</p>
          </div>
        )}

        {/* Title & meta */}
        <h1 className="font-display text-3xl md:text-4xl font-bold text-recetario-fg mb-3">{recipeData.titulo}</h1>
        <div className="flex flex-wrap gap-3 mb-8 text-sm text-recetario-muted font-body">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{recipeData.tiempo_estimado}</span>
          <span className="flex items-center gap-1"><Flame className="w-4 h-4" />{recipeData.dificultad}</span>
          <span className="flex items-center gap-1"><ChefHat className="w-4 h-4" />{recipeData.tipo_receta}</span>
          {recipeData.calorias_por_racion && (
            <span className="flex items-center gap-1">🔥 ~{recipeData.calorias_por_racion} kcal</span>
          )}
        </div>

        {/* Servings selector */}
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

        {/* Ingredients */}
        <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border mb-6">
          <h2 className="font-display text-xl font-bold text-recetario-fg mb-4">Ingredientes</h2>
          <ul className="space-y-2">
            {recipeData.ingredientes.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-recetario-fg font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-recetario-primary flex-shrink-0" />
                <span className="font-medium">{ing.cantidad} {ing.unidad}</span>
                <span className="text-recetario-muted">{ing.nombre}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border mb-6">
          <h2 className="font-display text-xl font-bold text-recetario-fg mb-4">Preparación</h2>
          <ol className="space-y-4">
            {recipeData.pasos.map((paso, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-recetario-primary/10 text-recetario-primary flex items-center justify-center flex-shrink-0 text-sm font-bold font-display">
                  {i + 1}
                </span>
                <p className="text-sm text-recetario-fg leading-relaxed pt-1 font-body">{paso}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Final tip */}
        {recipeData.consejo_final && (
          <div className="bg-recetario-primary/5 rounded-2xl p-5 border border-recetario-primary/15 mb-6">
            <p className="text-sm text-recetario-primary font-medium mb-1">💡 Consejo de la abuela</p>
            <p className="text-sm text-recetario-muted italic font-body">{recipeData.consejo_final}</p>
          </div>
        )}

        {/* Interactive features */}
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

        {/* Action buttons */}
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
      </div>
    </div>
  );
}
