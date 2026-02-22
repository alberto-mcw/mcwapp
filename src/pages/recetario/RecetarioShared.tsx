import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Clock, ChefHat, Flame, ArrowRight, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface RecipeData {
  titulo: string;
  ingredientes: Array<{ nombre: string; cantidad: number; unidad: string }>;
  pasos: string[];
  tiempo_estimado: string;
  dificultad: string;
  tipo_receta: string;
  raciones: number;
  calorias_por_racion?: number;
  historia_emocional?: string;
  consejo_final?: string;
}

export default function RecetarioShared() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedRecipe();
    trackClick();
  }, [token]);

  const loadSharedRecipe = async () => {
    if (!token) return;
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("share_token", token)
      .in("visibility", ["shared", "public"])
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }
    setRecipe(data);
    setLoading(false);
  };

  const trackClick = async () => {
    if (!token) return;
    const { data: share } = await supabase
      .from("recipe_shares")
      .select("id, clicks")
      .eq("share_token", token)
      .single();

    if (share) {
      await supabase
        .from("recipe_shares")
        .update({ clicks: (share.clicks || 0) + 1 })
        .eq("id", share.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-recetario-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-recetario-primary" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-recetario-bg flex flex-col items-center justify-center px-6">
        <BookOpen className="w-12 h-12 text-recetario-primary/30 mb-4" />
        <h1 className="font-display text-xl font-bold text-recetario-fg mb-2">Receta no encontrada</h1>
        <p className="text-sm text-recetario-muted mb-6 font-body">Esta receta puede haber sido eliminada o ser privada.</p>
        <Button onClick={() => navigate("/recetario")} className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full">
          Digitaliza tu propia receta
        </Button>
      </div>
    );
  }

  const data = recipe.structured_data as RecipeData;

  return (
    <div className="min-h-screen bg-recetario-bg">
      {/* Header */}
      <header className="px-6 py-4 max-w-3xl mx-auto flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-recetario-primary" />
        <span className="font-display text-lg font-bold text-recetario-fg">El Recetario Eterno</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {/* Story */}
        {data?.historia_emocional && (
          <div className="bg-recetario-surface rounded-2xl p-6 mb-6 border border-recetario-border">
            <p className="font-display italic text-recetario-muted text-sm leading-relaxed">{data.historia_emocional}</p>
          </div>
        )}

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl font-bold text-recetario-fg mb-3">{data?.titulo || recipe.title}</h1>
        <div className="flex flex-wrap gap-3 mb-8 text-sm text-recetario-muted font-body">
          {data?.tiempo_estimado && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{data.tiempo_estimado}</span>}
          {data?.dificultad && <span className="flex items-center gap-1"><Flame className="w-4 h-4" />{data.dificultad}</span>}
          {data?.tipo_receta && <span className="flex items-center gap-1"><ChefHat className="w-4 h-4" />{data.tipo_receta}</span>}
          {data?.raciones && <span className="flex items-center gap-1"><Users className="w-4 h-4" />{data.raciones} personas</span>}
        </div>

        {/* Ingredients */}
        {data?.ingredientes && (
          <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border mb-6">
            <h2 className="font-display text-xl font-bold text-recetario-fg mb-4">Ingredientes</h2>
            <ul className="space-y-2">
              {data.ingredientes.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-recetario-fg font-body">
                  <span className="w-1.5 h-1.5 rounded-full bg-recetario-primary" />
                  <span className="font-medium">{ing.cantidad} {ing.unidad}</span>
                  <span className="text-recetario-muted">{ing.nombre}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {data?.pasos && (
          <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border mb-8">
            <h2 className="font-display text-xl font-bold text-recetario-fg mb-4">Preparación</h2>
            <ol className="space-y-4">
              {data.pasos.map((paso, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-recetario-primary/10 text-recetario-primary flex items-center justify-center flex-shrink-0 text-sm font-bold font-display">
                    {i + 1}
                  </span>
                  <p className="text-sm text-recetario-fg leading-relaxed pt-1 font-body">{paso}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Final tip */}
        {data?.consejo_final && (
          <div className="bg-recetario-primary/5 rounded-2xl p-5 border border-recetario-primary/15 mb-8">
            <p className="text-sm text-recetario-primary font-medium mb-1">💡 Consejo de la abuela</p>
            <p className="text-sm text-recetario-muted italic font-body">{data.consejo_final}</p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-recetario-fg rounded-3xl p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-recetario-bg mb-3">
            ¿Tienes recetas manuscritas?
          </h2>
          <p className="text-sm text-recetario-muted-light mb-6 font-body">
            Digitaliza las recetas de tu familia y presérvalas para siempre con inteligencia artificial. Gratis.
          </p>
          <Button
            onClick={() => navigate(`/recetario?ref=${token}`)}
            className="bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full px-6 py-5 text-base shadow-lg shadow-recetario-primary/25"
          >
            Digitaliza tu propia receta
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
