import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Search, Play, Clock, ChefHat, Star, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import recipesRaw from '@/data/recipes.json';

/* ─── Types ─────────────────────────────────────────────────── */
interface MCWRecipeIngredient {
  value: number;
  unitOfMeasurement?: string;
  ingredient: { name: string };
}
interface MCWRecipe {
  id: string;
  name: string;
  description?: string;
  cookingTime?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  isPremium?: boolean;
  servingNumber?: number;
  images?: { url: string }[];
  video?: { url: string; thumbnail?: { url: string } };
  author?: { firstName: string; lastName: string; profilePicture?: { url: string } };
  categories?: { id: string; name: string }[];
  tags?: { name: string }[];
  cuisines?: { id: string; name: string }[];
  ingredients?: MCWRecipeIngredient[];
  instructions?: string[];
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Intermedio',
  HARD: 'Avanzado',
};

const SAMPLE_RECIPES: MCWRecipe[] = [
  {
    id: 's1', name: 'Sopa de mariscos y vegetales',
    description: 'Un caldo intenso y aromático con almejas, gambas y verduras de temporada.',
    cookingTime: 35, difficulty: 'MEDIUM', isPremium: false, servingNumber: 4,
    images: [{ url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80' }],
    author: { firstName: 'Ailu', lastName: 'Saraceni', profilePicture: { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' } },
    categories: [{ id: 'c1', name: 'Videoreceta' }],
    tags: [{ name: 'Sopas' }, { name: 'Mariscos' }],
  },
  {
    id: 's2', name: 'Risotto de calabaza y queso azul con nueces',
    description: 'Arroz cremoso al estilo italiano con calabaza asada, gorgonzola y nueces tostadas.',
    cookingTime: 40, difficulty: 'MEDIUM', isPremium: true, servingNumber: 2,
    images: [{ url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80' }],
    author: { firstName: 'Ailu', lastName: 'Saraceni', profilePicture: { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' } },
    categories: [{ id: 'c2', name: 'Videoreceta' }],
    tags: [{ name: 'Arroces' }, { name: 'Vegetariano' }],
  },
  {
    id: 's3', name: 'Tataki de atún con vinagreta de sésamo',
    description: 'Atún rojo marcado a la plancha con salsa ponzu y semillas de sésamo doradas.',
    cookingTime: 15, difficulty: 'EASY', isPremium: false, servingNumber: 2,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' }],
    author: { firstName: 'Carlos', lastName: 'Maldonado', profilePicture: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' } },
    categories: [{ id: 'c1', name: 'Videoreceta' }],
    tags: [{ name: 'Pescados' }, { name: 'Japonés' }],
  },
  {
    id: 's4', name: 'Croquetas de jamón ibérico y leche de oveja',
    description: 'La croqueta perfecta: crujiente por fuera, cremosa por dentro con jamón de bellota.',
    cookingTime: 60, difficulty: 'MEDIUM', isPremium: false, servingNumber: 6,
    images: [{ url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80' }],
    author: { firstName: 'Laura', lastName: 'Sánchez', profilePicture: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' } },
    categories: [{ id: 'c3', name: 'Receta' }],
    tags: [{ name: 'Tapas' }, { name: 'Español' }],
  },
  {
    id: 's5', name: 'Gazpacho de remolacha con burrata',
    description: 'Versión moderna del gazpacho andaluz con remolacha asada y cremosa burrata.',
    cookingTime: 20, difficulty: 'EASY', isPremium: false, servingNumber: 4,
    images: [{ url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' }],
    author: { firstName: 'Raquel', lastName: 'Meroño', profilePicture: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' } },
    categories: [{ id: 'c3', name: 'Receta' }],
    tags: [{ name: 'Sopas frías' }, { name: 'Vegetariano' }],
  },
  {
    id: 's6', name: 'Coulant de chocolate negro 70%',
    description: 'El postre estrella de la alta cocina: exterior firme y corazón fundente de chocolate.',
    cookingTime: 25, difficulty: 'HARD', isPremium: true, servingNumber: 4,
    images: [{ url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80' }],
    author: { firstName: 'Sofía', lastName: 'Torres', profilePicture: { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80' } },
    categories: [{ id: 'c1', name: 'Videoreceta' }],
    tags: [{ name: 'Postres' }, { name: 'Chocolate' }],
  },
];

const CHEFS = [
  { name: 'Laura Sánchez', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' },
  { name: 'Raquel Meroño', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { name: 'Sofía Torres', img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80' },
  { name: 'Carlos Maldonado', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { name: 'Ailu Saraceni', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
];

/* ─── Sub-components ─────────────────────────────────────────── */
const RecipeCard = ({ recipe, onClick }: { recipe: MCWRecipe; onClick: () => void }) => {
  const imgUrl = recipe.images?.[0]?.url;
  const authorName = recipe.author ? `${recipe.author.firstName} ${recipe.author.lastName}` : null;

  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden text-left bg-card border border-border hover:border-primary/30 transition-all"
    >
      <div className="aspect-[4/3] overflow-hidden">
        {imgUrl ? (
          <img src={imgUrl} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        {recipe.isPremium && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-amber-500/90 text-white rounded-full px-2.5 py-1 font-medium">
            <Star className="w-3 h-3" />Premium
          </span>
        )}
        {recipe.video?.url && (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-3.5 h-3.5 text-white fill-white" strokeWidth={0} />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        {authorName && (
          <div className="flex items-center gap-2">
            {recipe.author?.profilePicture?.url && (
              <img src={recipe.author.profilePicture.url} alt={authorName} className="w-5 h-5 rounded-full object-cover" />
            )}
            <span className="text-xs text-muted-foreground">{authorName}</span>
          </div>
        )}
        <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {recipe.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {recipe.cookingTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{recipe.cookingTime} min
            </span>
          )}
          {recipe.difficulty && (
            <span>{DIFFICULTY_LABEL[recipe.difficulty]}</span>
          )}
          {recipe.categories?.[0] && (
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {recipe.categories[0].name}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

/* ─── Main page ──────────────────────────────────────────────── */
const Recetas = () => {
  const { t } = useTranslation();
  const allRecipes: MCWRecipe[] = (recipesRaw as MCWRecipe[]).length > 0
    ? (recipesRaw as MCWRecipe[])
    : SAMPLE_RECIPES;

  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  const isSearching = searchQuery.length > 0;
  const filtered = isSearching
    ? allRecipes.filter(r =>
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.tags ?? []).some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const trending = allRecipes.slice(0, 6);
  const forYou = allRecipes.slice(2, 8);
  const heroRecipe = allRecipes[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-20" style={{ minHeight: 500 }}>
        <img
          src={heroRecipe?.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80'}
          alt="Recetas hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="relative container mx-auto px-4 flex flex-col justify-end h-full py-16 md:py-24">
          <p className="text-sm text-primary font-medium mb-2">{t('recetasPage.badge')}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-3">
            {t('recetasPage.heroTitle1')}<br />
            <span className="text-primary">{t('recetasPage.heroTitle2')}</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mb-6">{t('recetasPage.heroSubtitle')}</p>

          {/* Search */}
          <form
            className="relative max-w-md"
            onSubmit={e => { e.preventDefault(); if (inputValue.trim()) setSearchQuery(inputValue.trim()); }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={t('recetasPage.searchPlaceholder')}
              className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </form>
        </div>
      </section>

      {/* Recetario Eterno banner */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-[#8B6914]/20 via-[#A67C00]/10 to-[#8B6914]/20 border border-[#A67C00]/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1">{t('recetasPage.subsection')}</p>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('recetarioSection.title')}</h2>
            <p className="text-muted-foreground text-sm mb-4">{t('recetarioSection.description')}</p>
            <Button asChild className="gap-2">
              <Link to="/recetario">
                <BookOpen className="w-4 h-4" />
                {t('recetarioSection.cta')}
              </Link>
            </Button>
          </div>
          <div className="w-32 h-32 rounded-2xl bg-[#A67C00]/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-16 h-16 text-[#A67C00]/60" />
          </div>
        </div>
      </section>

      {/* Search results or content */}
      <div className="container mx-auto px-4 pb-16">
        {isSearching ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {t('recetasPage.resultsFor')} <span className="text-foreground font-medium">"{searchQuery}"</span>
              </p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setInputValue(''); }}>
                {t('recetasPage.clearSearch')}
              </Button>
            </div>
            {filtered!.length === 0 ? (
              <div className="text-center py-20">
                <ChefHat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{t('recetasPage.noResults')}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered!.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} onClick={() => {}} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* En tendencia */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t('recetasPage.trending')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {trending.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} onClick={() => {}} />
                ))}
              </div>
            </div>

            {/* Recetas para ti */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t('recetasPage.forYou')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {forYou.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} onClick={() => {}} />
                ))}
              </div>
            </div>

            {/* Nuestros chefs */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">{t('recetasPage.ourChefs')}</h2>
              <div className="flex flex-wrap gap-8 justify-center md:justify-start">
                {CHEFS.map((chef, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors">
                      <img src={chef.img} alt={chef.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">{chef.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Recetas;
