import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { Play, FileText } from 'lucide-react';

const IMGS = {
  hero: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  food1: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80',
  food2: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
  food3: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  chef1: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&q=80',
  chef2: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=300&q=80',
  chef3: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=300&q=80',
  chef4: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300&q=80',
  chef5: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&q=80',
};

const NOVEDADES = [
  { id: 1, img: IMGS.food1, title: 'Risotto de setas con trufa negra y parmesano' },
  { id: 2, img: IMGS.food2, title: 'Sopa castellana con huevo poché y jamón ibérico' },
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
  { id: 2, title: 'El corte en Juliana: Pasos y guía completa', time: '5 min' },
];

const ChefBadge = ({ name }: { name: string }) => (
  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 w-fit">
    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
    <span className="text-white text-xs font-medium">{name}</span>
  </div>
);

const SectionHead = ({ title, counter }: { title: string; counter?: string }) => (
  <div className="flex items-baseline justify-between px-4 pt-6 pb-3">
    <span className="app-section-title">{title}</span>
    {counter && <span className="app-caption">{counter}</span>}
  </div>
);

const AppTheKitchen = () => {
  return (
    <MobileAppLayout>
      <AppHeader />

      {/* Hero section — naranja */}
      <div className="bg-gradient-to-b from-[#F3AD68] to-[#FC6B37] px-4 pt-6 pb-5">
        <h1 className="text-3xl font-normal text-white leading-tight mb-1" style={{ fontFamily: 'Unbounded, sans-serif' }}>
          The Kitchen
        </h1>
        <p className="app-body text-white/80 mb-5">La cocina más top con Chefs y Celebrities</p>

        {/* Hero card */}
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 260 }}>
          <img src={IMGS.hero} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <ChefBadge name="Laura Sánchez" />
            <p className="app-heading text-white">Cómo hacer la pasta carbonara perfecta</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-primary/20 border border-primary/40 text-primary text-xs px-2 py-0.5 rounded-full">Videoreceta</span>
                <span className="app-caption text-white/60">20 min · Media</span>
              </div>
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-white fill-white" strokeWidth={0} />
              </button>
            </div>
          </div>
          <div className="absolute top-3 right-3">
            <span className="app-caption text-white/50">Scrollea ↓</span>
          </div>
        </div>
      </div>

      {/* Novedades del día */}
      <SectionHead title="Novedades del día" counter="01/05" />
      <div className="px-4 space-y-3">
        {NOVEDADES.map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <p className="app-heading text-white/90 line-clamp-2 flex-1">{item.title}</p>
          </div>
        ))}
      </div>

      {/* Big featured card */}
      <div className="px-4 pt-5">
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
          <img src={IMGS.food3} alt="Featured" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <ChefBadge name="Carlos Maldonado" />
            <p className="app-heading text-white">Técnicas avanzadas de emplatado profesional</p>
            <div className="flex items-center gap-2">
              <span className="bg-primary/20 border border-primary/40 text-primary text-xs px-2 py-0.5 rounded-full">Videoreceta</span>
              <span className="app-caption text-white/60">35 min · Avanzado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Patrocinadores */}
      <SectionHead title="Nuestros patrocinadores" />
      <div className="flex items-center gap-2 px-4 overflow-x-auto pb-1 scrollbar-hide">
        {SPONSORS.map(s => (
          <div key={s} className="flex-shrink-0 bg-card border border-border rounded-full px-4 py-2">
            <span className="app-body-sm text-white/70 whitespace-nowrap">{s}</span>
          </div>
        ))}
        <button className="flex-shrink-0 bg-primary/10 border border-primary/30 rounded-full px-4 py-2">
          <span className="app-body-sm text-primary whitespace-nowrap">Ver todo</span>
        </button>
      </div>

      {/* De nuestros Chefs */}
      <SectionHead title="De nuestros Chefs" counter="01/05" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {CHEF_RECETAS.map(item => (
          <div key={item.id} className="flex-shrink-0 w-44 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 space-y-1">
              <p className="app-heading text-white line-clamp-2 leading-snug">{item.title}</p>
              <p className="app-caption text-white/40">{item.chef}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Han pasado por The Kitchen */}
      <SectionHead title="Han pasado por The Kitchen" />
      <div className="flex gap-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {CHEFS_FEATURED.map(chef => (
          <div key={chef.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-16">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
              <img src={chef.img} alt={chef.name} className="w-full h-full object-cover" />
            </div>
            <span className="app-caption text-white/60 text-center leading-tight">{chef.name}</span>
          </div>
        ))}
      </div>

      {/* Artículos recomendados */}
      <SectionHead title="Artículos recomendados" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-6 scrollbar-hide">
        {ARTICULOS.map(item => (
          <div key={item.id} className="flex-shrink-0 w-44 bg-card border border-border rounded-2xl p-3 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="app-heading text-white line-clamp-3 leading-snug">{item.title}</p>
            <span className="app-caption text-white/40">Artículo · {item.time}</span>
          </div>
        ))}
      </div>
    </MobileAppLayout>
  );
};

export default AppTheKitchen;
