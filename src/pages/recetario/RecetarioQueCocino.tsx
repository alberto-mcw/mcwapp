import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Type, Loader2, ChefHat, Clock, Sparkles, ArrowRight, X, Plus, BookOpen, ImagePlus, UtensilsCrossed, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecetarioAccountMenu } from "@/components/recetario/RecetarioAccountMenu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCollections } from "@/hooks/useCollections";

type InputMode = "photo" | "text" | null;

type RecipeMatch = {
  id: string;
  title: string;
  structured_data: any;
  original_image_url?: string;
  difficulty?: string;
  estimated_time?: string;
  servings?: number;
  recipe_type?: string;
  match_reason?: string;
};

type AISuggestion = {
  titulo: string;
  descripcion: string;
  ingredientes_principales: string[];
  tiempo_estimado: string;
  dificultad: string;
};

export default function RecetarioQueCocino() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { collections, createCollection, addRecipeToCollection } = useCollections();

  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [images, setImages] = useState<string[]>([]);
  const [textIngredients, setTextIngredients] = useState("");
  const [manualIngredients, setManualIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<"input" | "confirm" | "results">("input");

  // Results
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>([]);
  const [userMatches, setUserMatches] = useState<RecipeMatch[]>([]);
  const [publicMatches, setPublicMatches] = useState<RecipeMatch[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  const leadId = sessionStorage.getItem("recetario_lead_id");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (images.length >= 5) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addIngredient = () => {
    const trimmed = currentIngredient.trim();
    if (trimmed && !manualIngredients.includes(trimmed.toLowerCase())) {
      setManualIngredients((prev) => [...prev, trimmed.toLowerCase()]);
      setCurrentIngredient("");
    }
  };

  const removeIngredient = (index: number) => {
    setManualIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearch = async () => {
    const ingredientsList = inputMode === "text" ? manualIngredients : [];

    if (inputMode === "photo" && images.length === 0) {
      toast.error("Sube al menos una foto");
      return;
    }
    if (inputMode === "text" && ingredientsList.length === 0) {
      toast.error("Añade al menos un ingrediente");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("what-to-cook", {
        body: {
          ingredients: ingredientsList,
          images: inputMode === "photo" ? images : [],
          userId: user?.id || null,
          leadId: leadId || null,
        },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        if (data.extractedIngredients) {
          setExtractedIngredients(data.extractedIngredients);
        }
        setLoading(false);
        return;
      }

      setExtractedIngredients(data.extractedIngredients || []);
      setUserMatches(data.userMatches || []);
      setPublicMatches(data.publicMatches || []);
      setAiSuggestions(data.aiSuggestions || []);
      setStep("results");
    } catch (err) {
      console.error(err);
      toast.error("Error al buscar recetas. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const saveAiSuggestion = async (suggestion: AISuggestion, index: number) => {
    setSavingIndex(index);
    try {
      const recipeId = crypto.randomUUID();
      const structuredData = {
        titulo: suggestion.titulo,
        descripcion: suggestion.descripcion,
        ingredientes: suggestion.ingredientes_principales.map((ing) => ({ nombre: ing, cantidad: "" })),
        pasos: [],
      };

      const insertData: any = {
        id: recipeId,
        title: suggestion.titulo,
        structured_data: structuredData,
        status: "completed",
        difficulty: suggestion.dificultad,
        estimated_time: suggestion.tiempo_estimado,
        ai_story: suggestion.descripcion,
      };

      if (user?.id) {
        insertData.user_id = user.id;
      } else if (leadId) {
        insertData.lead_id = leadId;
      }

      const { error } = await supabase.from("recipes").insert(insertData);
      if (error) throw error;

      // Add to "¿Qué cocino hoy? IA" collection
      const AI_COLLECTION_NAME = "¿Qué cocino hoy? IA";
      let collection = collections.find((c) => c.name === AI_COLLECTION_NAME);
      if (!collection) {
        collection = await createCollection(AI_COLLECTION_NAME, "Recetas sugeridas por la IA basadas en tus ingredientes") || undefined;
      }
      if (collection) {
        await addRecipeToCollection(collection.id, recipeId);
      }

      setSavedIndexes((prev) => new Set(prev).add(index));
      toast.success(`"${suggestion.titulo}" guardada en tu biblioteca`);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la receta");
    } finally {
      setSavingIndex(null);
    }
  };

  const totalResults = userMatches.length + publicMatches.length + aiSuggestions.length;

  return (
    <div className="min-h-screen recetario-vichy-bg text-recetario-fg">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/recetario")}>
          <img src="/images/recetario-logo.png" alt="Mi Recetario Eterno" className="h-12" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-recetario-primary hover:text-recetario-primary-hover text-sm font-medium"
            onClick={() => navigate("/recetario/biblioteca")}
          >
            <BookOpen className="w-4 h-4 mr-1" /> Mi Biblioteca
          </Button>
          <RecetarioAccountMenu />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pb-20">
        {/* Title */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center gap-2 bg-recetario-primary/10 text-recetario-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <UtensilsCrossed className="w-4 h-4" />
            Asistente de cocina con IA
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-recetario-fg mb-2">
            ¿Qué cocino hoy?
          </h1>
          <p className="text-recetario-muted font-body">
            Dinos qué tienes en la nevera y te sugerimos recetas
          </p>
        </div>

        {step === "input" && (
          <>
            {/* Mode Selection */}
            {!inputMode && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setInputMode("photo")}
                  className="bg-recetario-card rounded-2xl p-6 border border-recetario-border hover:border-recetario-primary/50 hover:shadow-md transition-all text-center group"
                >
                  <div className="w-14 h-14 bg-recetario-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-recetario-primary/20 transition-colors">
                    <Camera className="w-7 h-7 text-recetario-primary" />
                  </div>
                  <h3 className="font-display font-bold text-recetario-fg mb-1">Foto de la nevera</h3>
                  <p className="text-xs text-recetario-muted font-body">Sube una o varias fotos y la IA identifica los ingredientes</p>
                </button>
                <button
                  onClick={() => setInputMode("text")}
                  className="bg-recetario-card rounded-2xl p-6 border border-recetario-border hover:border-recetario-primary/50 hover:shadow-md transition-all text-center group"
                >
                  <div className="w-14 h-14 bg-recetario-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-recetario-primary/20 transition-colors">
                    <Type className="w-7 h-7 text-recetario-primary" />
                  </div>
                  <h3 className="font-display font-bold text-recetario-fg mb-1">Escribir ingredientes</h3>
                  <p className="text-xs text-recetario-muted font-body">Escribe manualmente lo que tienes disponible</p>
                </button>
              </div>
            )}

            {/* Photo Mode */}
            {inputMode === "photo" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-recetario-fg">Fotos de tu nevera / despensa</h3>
                  <button onClick={() => { setInputMode(null); setImages([]); }} className="text-xs text-recetario-muted hover:text-recetario-primary font-body">
                    Cambiar método
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-recetario-border">
                      <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-recetario-fg/70 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-recetario-primary/30 flex flex-col items-center justify-center text-recetario-primary hover:bg-recetario-primary/5 transition-colors"
                    >
                      <ImagePlus className="w-6 h-6 mb-1" />
                      <span className="text-xs font-body">Añadir</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-recetario-muted-light font-body text-center">Máximo 5 fotos</p>

                <Button
                  onClick={handleSearch}
                  disabled={images.length === 0 || loading}
                  className="w-full bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full py-6 text-lg"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analizando ingredientes...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> Buscar recetas</>
                  )}
                </Button>
              </div>
            )}

            {/* Text Mode */}
            {inputMode === "text" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-recetario-fg">¿Qué ingredientes tienes?</h3>
                  <button onClick={() => { setInputMode(null); setManualIngredients([]); }} className="text-xs text-recetario-muted hover:text-recetario-primary font-body">
                    Cambiar método
                  </button>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={currentIngredient}
                    onChange={(e) => setCurrentIngredient(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addIngredient()}
                    placeholder="ej: tomate, cebolla, pollo..."
                    className="flex-1 rounded-xl border-recetario-border bg-recetario-card text-recetario-fg placeholder:text-recetario-muted-light/50 focus-visible:ring-recetario-primary"
                  />
                  <Button
                    onClick={addIngredient}
                    variant="outline"
                    className="rounded-xl border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {manualIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {manualIngredients.map((ing, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-recetario-primary/10 text-recetario-primary px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        {ing}
                        <button onClick={() => removeIngredient(i)} className="hover:text-recetario-primary-hover">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleSearch}
                  disabled={manualIngredients.length === 0 || loading}
                  className="w-full bg-recetario-primary hover:bg-recetario-primary-hover text-white rounded-full py-6 text-lg"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Buscando recetas...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> Buscar recetas</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Results */}
        {step === "results" && (
          <div className="space-y-8">
            {/* Detected Ingredients */}
            <div className="bg-recetario-card rounded-2xl p-5 border border-recetario-border">
              <h3 className="font-display font-bold text-recetario-fg mb-3 text-sm">
                🧊 Ingredientes detectados ({extractedIngredients.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {extractedIngredients.map((ing, i) => (
                  <span key={i} className="bg-recetario-primary/10 text-recetario-primary px-3 py-1 rounded-full text-xs font-medium">
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {totalResults === 0 && (
              <div className="text-center py-12">
                <ChefHat className="w-12 h-12 text-recetario-muted-light mx-auto mb-4" />
                <p className="font-display text-lg text-recetario-muted">No encontramos recetas con esos ingredientes</p>
                <p className="text-sm text-recetario-muted-light font-body mt-1">Prueba añadiendo más ingredientes</p>
              </div>
            )}

            {/* User Recipes */}
            {userMatches.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-recetario-fg mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-recetario-primary" />
                  De tu recetario ({userMatches.length})
                </h3>
                <div className="grid gap-3">
                  {userMatches.map((recipe) => (
                    <RecipeResultCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={() => navigate(`/recetario/receta/${recipe.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Public Recipes */}
            {publicMatches.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-recetario-fg mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-recetario-primary" />
                  De la comunidad ({publicMatches.length})
                </h3>
                <div className="grid gap-3">
                  {publicMatches.map((recipe) => (
                    <RecipeResultCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={() => navigate(`/recetario/receta/${recipe.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-recetario-fg mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-recetario-primary" />
                  Sugerencias de la IA ({aiSuggestions.length})
                </h3>
                <div className="grid gap-3">
                  {aiSuggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="bg-recetario-card rounded-xl border border-recetario-border p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold text-recetario-fg mb-1">{suggestion.titulo}</h4>
                          <p className="text-sm text-recetario-muted font-body mb-3">{suggestion.descripcion}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingIndex === i || savedIndexes.has(i)}
                          onClick={() => saveAiSuggestion(suggestion, i)}
                          className={`rounded-full flex-shrink-0 text-xs h-8 ${
                            savedIndexes.has(i)
                              ? "border-green-500 text-green-600 bg-green-50"
                              : "border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5"
                          }`}
                        >
                          {savingIndex === i ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : savedIndexes.has(i) ? (
                            <><Check className="w-3 h-3 mr-1" /> Guardada</>
                          ) : (
                            <><Save className="w-3 h-3 mr-1" /> Guardar</>
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-recetario-muted-light font-body">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {suggestion.tiempo_estimado}</span>
                        <span>·</span>
                        <span>{suggestion.dificultad}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {suggestion.ingredientes_principales.map((ing, j) => (
                          <span key={j} className="bg-recetario-bg text-recetario-muted text-[10px] px-2 py-0.5 rounded-full">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Try Again */}
            <div className="text-center pt-4">
              <Button
                onClick={() => {
                  setStep("input");
                  setInputMode(null);
                  setImages([]);
                  setManualIngredients([]);
                  setExtractedIngredients([]);
                  setUserMatches([]);
                  setPublicMatches([]);
                  setAiSuggestions([]);
                }}
                variant="outline"
                className="rounded-full border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5"
              >
                Probar con otros ingredientes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeResultCard({ recipe, onClick }: { recipe: RecipeMatch; onClick: () => void }) {
  const sd = recipe.structured_data as any;
  const title = sd?.titulo || recipe.title;
  const imageUrl = sd?.generated_image_url || recipe.original_image_url;

  return (
    <button
      onClick={onClick}
      className="w-full bg-recetario-card rounded-xl border border-recetario-border p-3 flex gap-3 items-center hover:shadow-md transition-all text-left"
    >
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-bold text-recetario-fg text-sm truncate">{title}</h4>
        {recipe.match_reason && (
          <p className="text-xs text-recetario-primary font-body mt-0.5 line-clamp-1">{recipe.match_reason}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-recetario-muted-light font-body mt-1">
          {recipe.estimated_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.estimated_time}</span>}
          {recipe.difficulty && <><span>·</span><span>{recipe.difficulty}</span></>}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-recetario-muted-light flex-shrink-0" />
    </button>
  );
}
