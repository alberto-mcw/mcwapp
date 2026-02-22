import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Loader2, Clock, ChefHat, Copy, ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RecetarioExplorar() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cloningId, setCloningId] = useState<string | null>(null);

  const leadId = sessionStorage.getItem("recetario_lead_id");

  useEffect(() => {
    loadPublicRecipes();
  }, []);

  const loadPublicRecipes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("visibility", "public")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Error al cargar recetas");
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  };

  const cloneRecipe = async (recipe: any) => {
    if (!leadId) {
      toast.error("Necesitas registrarte primero para guardar recetas");
      navigate("/recetario/captura");
      return;
    }

    setCloningId(recipe.id);
    try {
      const { error } = await supabase.from("recipes").insert({
        lead_id: leadId,
        title: recipe.title,
        structured_data: recipe.structured_data,
        recipe_type: recipe.recipe_type,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        estimated_time: recipe.estimated_time,
        calories_per_serving: recipe.calories_per_serving,
        ai_story: recipe.ai_story,
        status: "completed",
        visibility: "private",
      });

      if (error) throw error;
      toast.success("¡Receta guardada en tu biblioteca!");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la receta");
    } finally {
      setCloningId(null);
    }
  };

  const filteredRecipes = recipes.filter((r) => {
    if (!search) return true;
    const title = (r.structured_data?.titulo || r.title || "").toLowerCase();
    return title.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen recetario-vichy-bg">
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/recetario/biblioteca")} className="text-recetario-muted hover:text-recetario-fg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/images/recetario-logo.png" alt="Mi Recetario Eterno" className="h-10" />
        </div>
        <Button
          onClick={() => navigate("/recetario/biblioteca")}
          variant="outline"
          size="sm"
          className="rounded-full border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5 text-sm h-9"
        >
          <BookOpen className="w-4 h-4 mr-1" /> Mi biblioteca
        </Button>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-recetario-muted-light" />
            <Input
              placeholder="Buscar recetas de la comunidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-recetario-border bg-recetario-card text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary"
            />
          </div>
        </div>

        <p className="text-sm text-recetario-muted mb-6 font-body">
          {filteredRecipes.length} receta{filteredRecipes.length !== 1 ? "s" : ""} de la comunidad
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-recetario-primary" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-10 h-10 text-recetario-primary/30 mx-auto mb-3" />
            <p className="text-recetario-muted-light text-sm font-body">
              {search ? "No se encontraron recetas" : "Aún no hay recetas públicas."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => {
              const data = recipe.structured_data as any;
              return (
                <div
                  key={recipe.id}
                  className="bg-recetario-card rounded-2xl border border-recetario-border overflow-hidden hover:shadow-lg transition-all group"
                >
                  {data?.generated_image_url && (
                    <img
                      src={data.generated_image_url}
                      alt={data?.titulo}
                      className="w-full h-32 object-cover cursor-pointer"
                      onClick={() => navigate(`/recetario/receta/${recipe.id}`)}
                    />
                  )}
                  <div
                    className={`${data?.generated_image_url ? "" : "bg-recetario-fg"} p-5 cursor-pointer`}
                    onClick={() => navigate(`/recetario/receta/${recipe.id}`)}
                  >
                    {!data?.generated_image_url && (
                      <p className="text-[10px] text-recetario-muted-light uppercase tracking-wider mb-1 font-display">
                        El Recetario Eterno
                      </p>
                    )}
                    <h3
                      className={`font-display text-lg font-bold leading-tight ${
                        data?.generated_image_url ? "text-recetario-fg" : "text-recetario-bg"
                      }`}
                    >
                      {data?.titulo || recipe.title}
                    </h3>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-recetario-muted font-body">
                      {data?.tiempo_estimado && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {data.tiempo_estimado}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ChefHat className="w-3 h-3" />
                        {recipe.recipe_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-recetario-bg text-recetario-primary px-2 py-1 rounded-full font-medium">
                        {recipe.servings} pers.
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          cloneRecipe(recipe);
                        }}
                        disabled={cloningId === recipe.id}
                        className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full text-xs h-8 px-3"
                      >
                        {cloningId === recipe.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Copy className="w-3 h-3 mr-1" />
                        )}
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
