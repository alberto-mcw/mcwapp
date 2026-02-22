import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Star, Clock, ChefHat, Download, Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

type SortBy = "date" | "favorites" | "type";

export default function RecetarioBiblioteca() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [search, setSearch] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [cookbookName, setCookbookName] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const leadId = sessionStorage.getItem("recetario_lead_id");
  const email = sessionStorage.getItem("recetario_email");

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    if (email) {
      setCookbookName(`El fogón de ${email.split("@")[0]}`);
    }
  }, [email]);

  const loadRecipes = async () => {
    setLoading(true);
    let query = supabase
      .from("recipes")
      .select("*")
      .eq("status", "completed");

    if (leadId) {
      query = query.eq("lead_id", leadId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Error al cargar recetas");
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  };

  const toggleFavorite = async (recipeId: string, current: boolean) => {
    await supabase.from("recipes").update({ is_favorite: !current }).eq("id", recipeId);
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, is_favorite: !current } : r))
    );
  };

  const filteredRecipes = recipes
    .filter((r) => {
      if (!search) return true;
      const title = (r.structured_data?.titulo || r.title || "").toLowerCase();
      return title.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "favorites") return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
      if (sortBy === "type") return (a.recipe_type || "").localeCompare(b.recipe_type || "");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const generateFullPdf = async () => {
    if (recipes.length === 0) {
      toast.error("No hay recetas para exportar");
      return;
    }
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = w - margin * 2;
      const name = cookbookName || "Mi Recetario Eterno";

      // ── Cover page ──
      doc.setFillColor(255, 248, 240);
      doc.rect(0, 0, w, h, "F");

      // Decorative line
      doc.setDrawColor(199, 91, 42);
      doc.setLineWidth(0.5);
      doc.line(w / 2 - 30, 55, w / 2 + 30, 55);

      doc.setFontSize(12);
      doc.setTextColor(139, 115, 85);
      doc.text("EL RECETARIO ETERNO", w / 2, 50, { align: "center" });

      doc.setFontSize(28);
      doc.setTextColor(61, 43, 31);
      const titleLines = doc.splitTextToSize(name, contentW - 20);
      doc.text(titleLines, w / 2, 80, { align: "center" });

      doc.line(w / 2 - 30, 80 + titleLines.length * 12, w / 2 + 30, 80 + titleLines.length * 12);

      doc.setFontSize(11);
      doc.setTextColor(139, 115, 85);
      doc.text(`${recipes.length} recetas`, w / 2, 110 + titleLines.length * 8, { align: "center" });
      doc.text("Edición 2026", w / 2, 118 + titleLines.length * 8, { align: "center" });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(180, 160, 140);
      doc.text("Digitalizado con El Recetario Eterno", w / 2, h - 20, { align: "center" });

      // ── Index page ──
      doc.addPage();
      doc.setFillColor(255, 248, 240);
      doc.rect(0, 0, w, h, "F");

      doc.setFontSize(18);
      doc.setTextColor(199, 91, 42);
      doc.text("Índice", margin, 30);
      
      doc.setDrawColor(199, 91, 42);
      doc.setLineWidth(0.3);
      doc.line(margin, 34, margin + 20, 34);

      let indexY = 45;
      doc.setFontSize(10);
      recipes.forEach((recipe, i) => {
        const data = recipe.structured_data as any;
        const title = data?.titulo || recipe.title || "Sin título";
        if (indexY > h - 25) {
          doc.addPage();
          doc.setFillColor(255, 248, 240);
          doc.rect(0, 0, w, h, "F");
          indexY = 30;
        }
        doc.setTextColor(139, 115, 85);
        doc.text(`${i + 1}.`, margin, indexY);
        doc.setTextColor(61, 43, 31);
        const truncTitle = title.length > 50 ? title.substring(0, 50) + "..." : title;
        doc.text(truncTitle, margin + 8, indexY);
        
        // Dotted line
        doc.setTextColor(200, 190, 175);
        const dots = ".".repeat(60);
        const titleW = doc.getTextWidth(truncTitle);
        const pageNum = `${i + 1}`;
        const pageNumW = doc.getTextWidth(pageNum);
        const dotsX = margin + 8 + titleW + 2;
        const dotsAvail = w - margin - pageNumW - 2 - dotsX;
        if (dotsAvail > 5) {
          const dotStr = dots.substring(0, Math.floor(dotsAvail / doc.getTextWidth(".")));
          doc.text(dotStr, dotsX, indexY);
        }
        doc.setTextColor(139, 115, 85);
        doc.text(pageNum, w - margin, indexY, { align: "right" });
        indexY += 7;
      });

      // ── Recipe pages ──
      for (const recipe of recipes) {
        const data = recipe.structured_data as any;
        if (!data) continue;

        doc.addPage();
        doc.setFillColor(255, 248, 240);
        doc.rect(0, 0, w, h, "F");
        let y = 25;

        // Title
        doc.setFontSize(20);
        doc.setTextColor(61, 43, 31);
        const recipeTitle = data.titulo || recipe.title || "Sin título";
        const rTitleLines = doc.splitTextToSize(recipeTitle, contentW);
        doc.text(rTitleLines, margin, y);
        y += rTitleLines.length * 8 + 2;

        // Decorative line
        doc.setDrawColor(199, 91, 42);
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + 25, y);
        y += 6;

        // Meta
        doc.setFontSize(9);
        doc.setTextColor(139, 115, 85);
        const meta = [
          data.tiempo_estimado && `⏱ ${data.tiempo_estimado}`,
          data.dificultad,
          `${recipe.servings || data.raciones || 4} personas`,
          data.calorias_por_racion && `~${data.calorias_por_racion} kcal`,
        ].filter(Boolean).join("  ·  ");
        doc.text(meta, margin, y);
        y += 8;

        // Story
        if (data.historia_emocional) {
          doc.setFontSize(9);
          doc.setTextColor(107, 87, 68);
          const storyLines = doc.splitTextToSize(data.historia_emocional, contentW);
          doc.text(storyLines, margin, y);
          y += storyLines.length * 4.5 + 5;
        }

        // Ingredients
        doc.setFontSize(13);
        doc.setTextColor(199, 91, 42);
        doc.text("Ingredientes", margin, y);
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(61, 43, 31);
        for (const ing of (data.ingredientes || [])) {
          if (y > h - 20) { doc.addPage(); doc.setFillColor(255, 248, 240); doc.rect(0, 0, w, h, "F"); y = 25; }
          doc.text(`•  ${ing.cantidad} ${ing.unidad} ${ing.nombre}`, margin + 2, y);
          y += 4.5;
        }
        y += 4;

        // Steps
        if (y > h - 40) { doc.addPage(); doc.setFillColor(255, 248, 240); doc.rect(0, 0, w, h, "F"); y = 25; }
        doc.setFontSize(13);
        doc.setTextColor(199, 91, 42);
        doc.text("Preparación", margin, y);
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(61, 43, 31);
        (data.pasos || []).forEach((step: string, i: number) => {
          if (y > h - 20) { doc.addPage(); doc.setFillColor(255, 248, 240); doc.rect(0, 0, w, h, "F"); y = 25; }
          const lines = doc.splitTextToSize(`${i + 1}. ${step}`, contentW);
          doc.text(lines, margin, y);
          y += lines.length * 4.5 + 2.5;
        });

        // Tip
        if (data.consejo_final) {
          y += 4;
          if (y > h - 25) { doc.addPage(); doc.setFillColor(255, 248, 240); doc.rect(0, 0, w, h, "F"); y = 25; }
          doc.setFontSize(9);
          doc.setTextColor(199, 91, 42);
          doc.text("💡 Consejo:", margin, y);
          y += 4.5;
          doc.setTextColor(107, 87, 68);
          const tipLines = doc.splitTextToSize(data.consejo_final, contentW);
          doc.text(tipLines, margin, y);
        }

        // Page footer
        doc.setFontSize(8);
        doc.setTextColor(200, 190, 175);
        doc.text(name, margin, h - 10);
        doc.text("El Recetario Eterno", w - margin, h - 10, { align: "right" });
      }

      doc.save(`${name.replace(/\s+/g, "_")}.pdf`);
      toast.success("¡Recetario descargado!");
      setShowPdfModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el recetario");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!leadId && !email) {
    return (
      <div className="min-h-screen bg-recetario-bg flex flex-col items-center justify-center px-6">
        <BookOpen className="w-12 h-12 text-recetario-primary mb-4" />
        <h1 className="font-display text-2xl font-bold text-recetario-fg mb-2">Mi Recetario Eterno</h1>
        <p className="text-recetario-muted text-sm mb-6 text-center max-w-sm font-body">
          Para acceder a tu biblioteca, primero necesitas digitalizar una receta.
        </p>
        <Button onClick={() => navigate("/recetario")} className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full px-6">
          Empezar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-recetario-bg">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-recetario-primary" />
          <span className="font-display text-lg font-bold text-recetario-fg">Mi Recetario Eterno</span>
        </div>
        <div className="flex gap-2">
          {recipes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPdfModal(true)}
              className="rounded-full border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5 text-sm h-9"
            >
              <Download className="w-4 h-4 mr-1" /> Descargar recetario
            </Button>
          )}
          <Button
            onClick={() => navigate("/recetario/subir")}
            className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-sm px-4 h-9"
          >
            <Plus className="w-4 h-4 mr-1" /> Nueva receta
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* Search & filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-recetario-muted-light" />
            <Input
              placeholder="Buscar recetas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-recetario-border bg-recetario-card text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary"
            />
          </div>
          <div className="flex gap-1">
            {(["date", "favorites", "type"] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  sortBy === s
                    ? "bg-recetario-primary text-white"
                    : "bg-recetario-card text-recetario-muted border border-recetario-border hover:bg-recetario-bg"
                }`}
              >
                {s === "date" ? "Fecha" : s === "favorites" ? "Favoritas" : "Tipo"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-recetario-card rounded-2xl p-4 border border-recetario-border text-center">
            <p className="text-2xl font-bold text-recetario-primary font-display">{recipes.length}</p>
            <p className="text-xs text-recetario-muted-light font-body">Recetas</p>
          </div>
          <div className="bg-recetario-card rounded-2xl p-4 border border-recetario-border text-center">
            <p className="text-2xl font-bold text-recetario-primary font-display">{recipes.filter((r) => r.is_favorite).length}</p>
            <p className="text-xs text-recetario-muted-light font-body">Favoritas</p>
          </div>
          <div className="bg-recetario-card rounded-2xl p-4 border border-recetario-border text-center">
            <p className="text-2xl font-bold text-recetario-primary font-display">{recipes.filter((r) => r.visibility === "shared").length}</p>
            <p className="text-xs text-recetario-muted-light font-body">Compartidas</p>
          </div>
        </div>

        {/* Recipe grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-recetario-primary" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-recetario-primary/30 mx-auto mb-3" />
            <p className="text-recetario-muted-light text-sm font-body">
              {search ? "No se encontraron recetas" : "Aún no tienes recetas. ¡Sube tu primera receta!"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => {
              const data = recipe.structured_data as any;
              return (
                <div
                  key={recipe.id}
                  className="bg-recetario-card rounded-2xl border border-recetario-border overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/recetario/receta/${recipe.id}`)}
                >
                  {/* Card image */}
                  {data?.generated_image_url && (
                    <img src={data.generated_image_url} alt={data?.titulo} className="w-full h-32 object-cover" />
                  )}
                  {/* Card header */}
                  <div className={`${data?.generated_image_url ? '' : 'bg-recetario-fg'} p-5 relative`}>
                    {!data?.generated_image_url && (
                      <p className="text-[10px] text-recetario-muted-light uppercase tracking-wider mb-1 font-display">El Recetario Eterno</p>
                    )}
                    <h3 className={`font-display text-lg font-bold leading-tight ${data?.generated_image_url ? 'text-recetario-fg' : 'text-recetario-bg'}`}>
                      {data?.titulo || recipe.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id, recipe.is_favorite);
                      }}
                      className="absolute top-4 right-4"
                    >
                      <Star
                        className={`w-5 h-5 transition-all ${
                          recipe.is_favorite ? "fill-recetario-primary text-recetario-primary" : "text-recetario-muted-light hover:text-recetario-primary"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-recetario-muted font-body">
                      {data?.tiempo_estimado && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{data.tiempo_estimado}</span>
                      )}
                      <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" />{recipe.recipe_type}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-recetario-bg text-recetario-primary px-2 py-1 rounded-full font-medium">{recipe.servings} pers.</span>
                      {recipe.healthy_version_active && (
                        <span className="text-xs bg-recetario-healthy-bg text-recetario-healthy px-2 py-1 rounded-full font-medium">Saludable</span>
                      )}
                      {recipe.visibility === "shared" && (
                        <span className="text-xs bg-recetario-surface text-recetario-muted px-2 py-1 rounded-full font-medium">Compartida</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-recetario-card rounded-2xl border border-recetario-border p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-recetario-fg">Descargar recetario</h2>
              <button onClick={() => setShowPdfModal(false)} className="text-recetario-muted-light hover:text-recetario-fg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-recetario-muted mb-4 font-body">
              Se generará un PDF con tus {recipes.length} recetas. Dale un nombre a tu recetario:
            </p>

            <Input
              value={cookbookName}
              onChange={(e) => setCookbookName(e.target.value)}
              placeholder="El fogón de Ángela"
              className="mb-4 h-12 rounded-xl border-recetario-border bg-recetario-bg text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary font-display text-lg"
            />

            <div className="bg-recetario-surface rounded-xl p-4 mb-5 border border-recetario-border">
              <p className="text-xs text-recetario-muted font-body mb-2">Tu recetario incluirá:</p>
              <ul className="text-xs text-recetario-fg font-body space-y-1">
                <li>📖 Portada personalizada</li>
                <li>📋 Índice con todas las recetas</li>
                <li>🍳 {recipes.length} recetas completas con ingredientes y pasos</li>
                <li>💡 Consejos y curiosidades</li>
              </ul>
            </div>

            <Button
              onClick={generateFullPdf}
              disabled={generatingPdf || !cookbookName.trim()}
              className="w-full bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full h-12 font-display text-base"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" /> Descargar recetario
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
