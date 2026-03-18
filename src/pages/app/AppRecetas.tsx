import { useState, useEffect } from 'react';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { supabase } from '@/integrations/supabase/client';
import { Search, ChefHat, Clock, Users, BookOpen } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
  prep_time?: number;
  servings?: number;
  image_url?: string;
  tags?: string[];
  category?: string;
}

const AppRecetas = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase
        .from('recipes')
        .select('id, name, description, ingredients, steps, prep_time, servings, image_url, tags, category')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      setRecipes(data || []);
      setLoading(false);
    };
    fetchRecipes();
  }, []);

  const filtered = recipes.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    (r.tags as string[] || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  // Recipe detail modal
  if (selected) {
    return (
      <MobileAppLayout>
        <AppHeader
          rightAction={
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              ← Volver
            </button>
          }
        />
        <div className="px-4 py-5 space-y-5">
          {selected.image_url && (
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-card">
              <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="app-heading text-left text-xl">{selected.name}</h1>
            {selected.description && (
              <p className="app-body-sm mt-1">{selected.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              {selected.prep_time && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {selected.prep_time} min
                </div>
              )}
              {selected.servings && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  {selected.servings} personas
                </div>
              )}
            </div>
          </div>

          {selected.ingredients && (selected.ingredients as string[]).length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="app-heading mb-3">Ingredientes</h3>
              <ul className="space-y-1.5">
                {(selected.ingredients as string[]).map((ing, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.steps && (selected.steps as string[]).length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="app-heading mb-3">Pasos</h3>
              <ol className="space-y-3">
                {(selected.steps as string[]).map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <AppHeader />

      <div className="px-4 pt-4 pb-4">
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar recetas..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          // Placeholder — no public recipes yet
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="app-heading">
                {search ? 'Sin resultados' : 'Próximamente'}
              </p>
              <p className="app-body-sm mt-1 max-w-xs">
                {search
                  ? 'No encontramos recetas con ese término.'
                  : 'Estamos preparando una selección de recetas exclusivas para ti.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelected(recipe)}
                className="bg-card border border-border rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
              >
                {recipe.image_url ? (
                  <div className="aspect-[4/3] bg-muted">
                    <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-primary/5 flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-primary/30" />
                  </div>
                )}
                <div className="p-3">
                  <p className="app-body-sm font-semibold line-clamp-2 leading-tight">{recipe.name}</p>
                  {recipe.prep_time && (
                    <p className="app-caption mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={1.5} />{recipe.prep_time} min
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileAppLayout>
  );
};

export default AppRecetas;
