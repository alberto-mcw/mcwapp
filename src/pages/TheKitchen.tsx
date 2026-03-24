import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Play, FileText, ChefHat } from 'lucide-react';

const IMGS = {
  hero: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
  food1: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
  food2: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  food3: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  chef1: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&q=80',
  chef2: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=300&q=80',
  chef3: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=300&q=80',
  chef4: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300&q=80',
  chef5: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&q=80',
};

const NOVEDADES = [
  { id: 1, img: IMGS.food1, title: 'Risotto de setas con trufa negra y parmesano' },
  { id: 2, img: IMGS.food2, title: 'Sopa castellana con huevo poché y jamón ibérico' },
  { id: 3, img: IMGS.food3, title: 'Técnicas avanzadas de emplatado profesional' },
];

const SPONSORS = ['Frial', 'Conservas Ortiz', 'HiCampus'];

const CHEF_RECETAS = [
  { id: 1, img: IMGS.food1, title: 'Risotto cremoso', chef: 'Laura Sánchez' },
  { id: 2, img: IMGS.food3, title: 'Pasta al pesto', chef: 'Carlos Maldonado' },
  { id: 3, img: IMGS.food2, title: 'Sopa de la abuela', chef: 'Raquel Meroño' },
];

const CHEFS_FEATURED = [
  { id: 1, img: IMGS.chef1, name: 'Laura Sánchez' },
  { id: 2, img: IMGS.chef2, name: 'Raquel Meroño' },
  { id: 3, img: IMGS.chef3, name: 'Sofía Torres' },
  { id: 4, img: IMGS.chef4, name: 'Carlos Maldonado' },
  { id: 5, img: IMGS.chef5, name: 'Álvaro Gómez' },
];

const ARTICULOS = [
  { id: 1, title: 'El corte en Juliana: Pasos y guía completa', time: '5 min' },
  { id: 2, title: 'Cómo preparar un caldo base profesional', time: '7 min' },
  { id: 3, title: 'Secretos del emplatado minimalista', time: '4 min' },
];

const TheKitchen = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-20" style={{ minHeight: 500 }}>
        <img src={IMGS.hero} alt="The Kitchen" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FC6B37]/80 via-[#F3AD68]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="relative container mx-auto px-4 flex flex-col justify-end h-full py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-3" style={{ fontFamily: 'Unbounded, sans-serif' }}>
            The Kitchen
          </h1>
          <p className="text-white/80 text-lg max-w-lg mb-4">{t('theKitchenPage.heroSubtitle')}</p>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-3 font-medium transition-colors">
              <Play className="w-4 h-4 fill-current" strokeWidth={0} />
              {t('theKitchenPage.watchNow')}
            </button>
          </div>
        </div>
      </section>

      {/* Featured hero card */}
      <section className="container mx-auto px-4 -mt-16 relative z-10 mb-12">
        <div className="relative rounded-2xl overflow-hidden max-w-3xl" style={{ height: 320 }}>
          <img src={IMGS.hero} alt="Featured" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-white text-sm font-medium">Laura Sánchez</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Cómo hacer la pasta carbonara perfecta</h2>
            <div className="flex items-center gap-3">
              <span className="bg-primary/20 border border-primary/40 text-primary text-sm px-3 py-1 rounded-full">Videoreceta</span>
              <span className="text-white/60 text-sm">20 min · Media</span>
            </div>
          </div>
        </div>
      </section>

      {/* Novedades del día */}
      <section className="container mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('theKitchenPage.dailyNews')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NOVEDADES.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Patrocinadores */}
      <section className="container mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('theKitchenPage.sponsors')}</h2>
        <div className="flex flex-wrap gap-3">
          {SPONSORS.map(s => (
            <div key={s} className="bg-card border border-border rounded-full px-6 py-3">
              <span className="text-muted-foreground font-medium">{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* De nuestros Chefs */}
      <section className="container mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('theKitchenPage.fromOurChefs')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHEF_RECETAS.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.chef}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Han pasado por The Kitchen */}
      <section className="container mx-auto px-4 mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('theKitchenPage.featuredChefs')}</h2>
        <div className="flex flex-wrap gap-8 justify-center md:justify-start">
          {CHEFS_FEATURED.map(chef => (
            <div key={chef.id} className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors">
                <img src={chef.img} alt={chef.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-muted-foreground text-center">{chef.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Artículos recomendados */}
      <section className="container mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('theKitchenPage.articles')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARTICULOS.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">{item.title}</h3>
              <span className="text-sm text-muted-foreground">{t('theKitchenPage.article')} · {item.time}</span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TheKitchen;
