import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Star, Clock, ChefHat, Download, Share2, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SortBy = "date" | "favorites" | "type";

export default function RecetarioBiblioteca() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [search, setSearch] = useState("");

  const leadId = sessionStorage.getItem("recetario_lead_id");
  const email = sessionStorage.getItem("recetario_email");

  useEffect(() => {
    loadRecipes();
  }, []);

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

  if (!leadId && !email) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6">
        <BookOpen className="w-12 h-12 text-[#C75B2A] mb-4" />
        <h1 className="font-serif text-2xl font-bold text-[#3D2B1F] mb-2">Mi Recetario Eterno</h1>
        <p className="text-[#6B5744] text-sm mb-6 text-center max-w-sm">
          Para acceder a tu biblioteca, primero necesitas digitalizar una receta.
        </p>
        <Button onClick={() => navigate("/recetario")} className="bg-[#C75B2A] hover:bg-[#A04520] text-white rounded-full px-6">
          Empezar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#C75B2A]" />
          <span className="font-serif text-lg font-bold text-[#3D2B1F]">Mi Recetario Eterno</span>
        </div>
        <Button
          onClick={() => navigate("/recetario/subir")}
          className="bg-[#C75B2A] hover:bg-[#A04520] text-white rounded-full text-sm px-4 h-9"
        >
          <Plus className="w-4 h-4 mr-1" /> Nueva receta
        </Button>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* Search & filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
            <Input
              placeholder="Buscar recetas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl border-[#E8D5C4] bg-white text-[#3D2B1F] placeholder:text-[#8B7355]/50 focus-visible:ring-[#C75B2A]"
            />
          </div>
          <div className="flex gap-1">
            {(["date", "favorites", "type"] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  sortBy === s ? "bg-[#C75B2A] text-white" : "bg-white text-[#6B5744] border border-[#E8D5C4] hover:bg-[#FFF8F0]"
                }`}
              >
                {s === "date" ? "Fecha" : s === "favorites" ? "Favoritas" : "Tipo"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-[#E8D5C4] text-center">
            <p className="text-2xl font-bold text-[#C75B2A]">{recipes.length}</p>
            <p className="text-xs text-[#8B7355]">Recetas</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8D5C4] text-center">
            <p className="text-2xl font-bold text-[#C75B2A]">{recipes.filter((r) => r.is_favorite).length}</p>
            <p className="text-xs text-[#8B7355]">Favoritas</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8D5C4] text-center">
            <p className="text-2xl font-bold text-[#C75B2A]">{recipes.filter((r) => r.visibility === "shared").length}</p>
            <p className="text-xs text-[#8B7355]">Compartidas</p>
          </div>
        </div>

        {/* Recipe grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#C75B2A]" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-[#C75B2A]/30 mx-auto mb-3" />
            <p className="text-[#8B7355] text-sm">
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
                  className="bg-white rounded-2xl border border-[#E8D5C4] overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/recetario/receta/${recipe.id}`)}
                >
                  {/* Card header */}
                  <div className="bg-[#3D2B1F] p-5 relative">
                    <p className="text-[10px] text-[#8B7355] uppercase tracking-wider mb-1">El Recetario Eterno</p>
                    <h3 className="font-serif text-lg font-bold text-[#FFF8F0] leading-tight">
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
                          recipe.is_favorite ? "fill-[#C75B2A] text-[#C75B2A]" : "text-[#8B7355] hover:text-[#C75B2A]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-[#6B5744]">
                      {data?.tiempo_estimado && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{data.tiempo_estimado}</span>
                      )}
                      <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" />{recipe.recipe_type}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-[#FFF8F0] text-[#C75B2A] px-2 py-1 rounded-lg">{recipe.servings} pers.</span>
                      {recipe.healthy_version_active && (
                        <span className="text-xs bg-[#E8F5E8] text-[#558250] px-2 py-1 rounded-lg">Saludable</span>
                      )}
                      {recipe.visibility === "shared" && (
                        <span className="text-xs bg-[#E8D5C4] text-[#6B5744] px-2 py-1 rounded-lg">Compartida</span>
                      )}
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
