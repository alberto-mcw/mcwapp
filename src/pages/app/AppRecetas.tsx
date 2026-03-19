import { useState } from 'react';
import { MobileAppLayout } from '@/components/app/MobileAppLayout';
import { AppHeader } from '@/components/app/AppHeader';
import { Search, Play, Clock, ChefHat, Bookmark, Star, ChevronRight, ArrowLeft } from 'lucide-react';
import { SecondaryHeader } from '@/components/app/SecondaryHeader';
// Local JSON populated by: BEARER_TOKEN=<token> node scripts/download-recipes.mjs
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

/* ─── Sample data (replaced by script when real data is available) ─── */
const SAMPLE_RECIPES: MCWRecipe[] = [
  {
    id: 's1',
    name: 'Sopa de mariscos y vegetales',
    description: 'Un caldo intenso y aromático con almejas, gambas y verduras de temporada.',
    cookingTime: 35,
    difficulty: 'MEDIUM',
    isPremium: false,
    servingNumber: 4,
    images: [{ url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80' }],
    author: { firstName: 'Ailu', lastName: 'Saraceni', profilePicture: { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' } },
    categories: [{ id: 'c1', name: 'Videoreceta' }],
    tags: [{ name: 'Sopas' }, { name: 'Mariscos' }],
    ingredients: [
      { value: 300, unitOfMeasurement: 'g', ingredient: { name: 'Almejas' } },
      { value: 200, unitOfMeasurement: 'g', ingredient: { name: 'Gambas peladas' } },
      { value: 1, unitOfMeasurement: '', ingredient: { name: 'Cebolla' } },
      { value: 2, unitOfMeasurement: '', ingredient: { name: 'Dientes de ajo' } },
      { value: 400, unitOfMeasurement: 'ml', ingredient: { name: 'Caldo de pescado' } },
      { value: 200, unitOfMeasurement: 'g', ingredient: { name: 'Tomate triturado' } },
    ],
    instructions: [
      'Sofríe la cebolla y el ajo en aceite de oliva a fuego medio durante 5 minutos.',
      'Añade el tomate triturado y cocina otros 5 minutos removiendo.',
      'Incorpora el caldo de pescado y lleva a ebullición.',
      'Agrega las almejas y gambas. Cocina 8-10 minutos hasta que se abran.',
      'Rectifica de sal y sirve caliente con pan crujiente.',
    ],
  },
  {
    id: 's2',
    name: 'Risotto de calabaza y queso azul con nueces',
    description: 'Arroz cremoso al estilo italiano con calabaza asada, gorgonzola y nueces tostadas.',
    cookingTime: 40,
    difficulty: 'MEDIUM',
    isPremium: true,
    servingNumber: 2,
    images: [{ url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80' }],
    author: { firstName: 'Ailu', lastName: 'Saraceni', profilePicture: { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' } },
    categories: [{ id: 'c2', name: 'Videoreceta' }],
    tags: [{ name: 'Arroces' }, { name: 'Vegetariano' }],
    ingredients: [
      { value: 200, unitOfMeasurement: 'g', ingredient: { name: 'Arroz arborio' } },
      { value: 300, unitOfMeasurement: 'g', ingredient: { name: 'Calabaza' } },
      { value: 80, unitOfMeasurement: 'g', ingredient: { name: 'Queso gorgonzola' } },
      { value: 50, unitOfMeasurement: 'g', ingredient: { name: 'Nueces' } },
      { value: 750, unitOfMeasurement: 'ml', ingredient: { name: 'Caldo de verduras' } },
      { value: 1, unitOfMeasurement: '', ingredient: { name: 'Cebolla' } },
    ],
    instructions: [
      'Asa la calabaza en cubos con aceite y sal a 200°C durante 20 minutos.',
      'Sofríe la cebolla picada en mantequilla hasta transparente.',
      'Añade el arroz y tuesta 2 minutos. Incorpora el caldo caliente poco a poco.',
      'Tras 18 minutos de cocción, integra la calabaza y el gorgonzola.',
      'Sirve con nueces tostadas y un hilo de aceite de trufa.',
    ],
  },
  {
    id: 's3',
    name: 'Tataki de atún con vinagreta de sésamo',
    description: 'Atún rojo marcado a la plancha con salsa ponzu y semillas de sésamo doradas.',
    cookingTime: 15,
    difficulty: 'EASY',
    isPremium: false,
    servingNumber: 2,
    images: [{ url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' }],
    author: { firstName: 'Carlos', lastName: 'Maldonado', profilePicture: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' } },
    categories: [{ id: 'c1', name: 'Videoreceta' }],
    tags: [{ name: 'Pescados' }, { name: 'Japonés' }],
    ingredients: [
      { value: 400, unitOfMeasurement: 'g', ingredient: { name: 'Lomo de atún rojo' } },
      { value: 3, unitOfMeasurement: 'cs', ingredient: { name: 'Salsa ponzu' } },
      { value: 2, unitOfMeasurement: 'cs', ingredient: { name: 'Sésamo tostado' } },
      { value: 1, unitOfMeasurement: 'cs', ingredient: { name: 'Aceite de sésamo' } },
    ],
    instructions: [
      'Sella el atún en plancha muy caliente 30 segundos por cada lado.',
      'Retira y corta en filetes de 1 cm con cuchillo bien afilado.',
      'Mezcla ponzu con aceite de sésamo y unas gotas de lima.',
      'Sirve el atún con la vinagreta, sésamo y brotes de rábano.',
    ],
  },
  {
    id: 's4',
    name: 'Croquetas de jamón ibérico y leche de oveja',
    description: 'La croqueta perfecta: crujiente por fuera, cremosa por dentro con jamón de bellota.',
    cookingTime: 60,
    difficulty: 'MEDIUM',
    isPremium: false,
    servingNumber: 6,
    images: [{ url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80' }],
    author: { firstName: 'Laura', lastName: 'Sánchez', profilePicture: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' } },
    categories: [{ id: 'c3', name: 'Receta' }],
    tags: [{ name: 'Tapas' }, { name: 'Español' }],
    ingredients: [
      { value: 150, unitOfMeasurement: 'g', ingredient: { name: 'Jamón ibérico de bellota' } },
      { value: 500, unitOfMeasurement: 'ml', ingredient: { name: 'Leche de oveja' } },
      { value: 60, unitOfMeasurement: 'g', ingredient: { name: 'Mantequilla' } },
      { value: 60, unitOfMeasurement: 'g', ingredient: { name: 'Harina' } },
      { value: 2, unitOfMeasurement: '', ingredient: { name: 'Huevos' } },
      { value: 150, unitOfMeasurement: 'g', ingredient: { name: 'Pan rallado grueso' } },
    ],
    instructions: [
      'Derrite la mantequilla y añade la harina. Cocina el roux 3 minutos a fuego bajo.',
      'Incorpora la leche caliente poco a poco sin dejar de remover hasta obtener una bechamel espesa.',
      'Añade el jamón picado fino. Enfría en nevera mínimo 4 horas.',
      'Forma las croquetas, pasa por huevo y pan rallado.',
      'Fríe en aceite a 180°C hasta doradas. Escurre en papel absorbente.',
    ],
  },
  {
    id: 's5',
    name: 'Gazpacho de remolacha con burrata',
    description: 'Versión moderna del gazpacho andaluz con remolacha asada y cremosa burrata.',
    cookingTime: 20,
    difficulty: 'EASY',
    isPremium: false,
    servingNumber: 4,
    images: [{ url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' }],
    author: { firstName: 'Raquel', lastName: 'Meroño', profilePicture: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' } },
    categories: [{ id: 'c3', name: 'Receta' }],
    tags: [{ name: 'Sopas frías' }, { name: 'Vegetariano' }],
    ingredients: [
      { value: 500, unitOfMeasurement: 'g', ingredient: { name: 'Remolacha cocida' } },
      { value: 400, unitOfMeasurement: 'g', ingredient: { name: 'Tomate maduro' } },
      { value: 1, unitOfMeasurement: '', ingredient: { name: 'Pepino' } },
      { value: 2, unitOfMeasurement: '', ingredient: { name: 'Burratas' } },
      { value: 60, unitOfMeasurement: 'ml', ingredient: { name: 'Aceite de oliva virgen extra' } },
    ],
    instructions: [
      'Tritura la remolacha, el tomate y el pepino con el aceite hasta homogéneo.',
      'Pasa por colador fino y rectifica de sal y vinagre.',
      'Refrigera mínimo 2 horas.',
      'Sirve en bol frío con la burrata al centro y un hilo de aceite.',
    ],
  },
  {
    id: 's6',
    name: 'Coulant de chocolate negro 70%',
    description: 'El postre estrella de la alta cocina: exterior firme y corazón fundente de chocolate.',
    cookingTime: 25,
    difficulty: 'HARD',
    isPremium: true,
    servingNumber: 4,
    images: [{ url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80' }],
    author: { firstName: 'Sofía', lastName: 'Torres', profilePicture: { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80' } },
    categories: [{ id: 'c1', name: 'Videoreceta' }],
    tags: [{ name: 'Postres' }, { name: 'Chocolate' }],
    ingredients: [
      { value: 200, unitOfMeasurement: 'g', ingredient: { name: 'Chocolate negro 70%' } },
      { value: 100, unitOfMeasurement: 'g', ingredient: { name: 'Mantequilla' } },
      { value: 4, unitOfMeasurement: '', ingredient: { name: 'Huevos' } },
      { value: 100, unitOfMeasurement: 'g', ingredient: { name: 'Azúcar' } },
      { value: 60, unitOfMeasurement: 'g', ingredient: { name: 'Harina' } },
    ],
    instructions: [
      'Funde el chocolate y la mantequilla al baño María. Deja templar.',
      'Bate huevos con azúcar hasta blanquear. Incorpora el chocolate.',
      'Añade la harina tamizada con movimientos envolventes.',
      'Vierte en moldes engrasados. Refrigera 30 minutos.',
      'Hornea a 200°C exactamente 10-11 minutos. Desmolda y sirve inmediatamente.',
    ],
  },
  {
    id: 's7',
    name: 'Arroz meloso de bogavante',
    description: 'Arroz de mar con bogavante vivo, ñora y azafrán. Un plato para ocasiones especiales.',
    cookingTime: 55,
    difficulty: 'HARD',
    isPremium: true,
    servingNumber: 2,
    images: [{ url: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=800&q=80' }],
    author: { firstName: 'Carlos', lastName: 'Maldonado', profilePicture: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' } },
    categories: [{ id: 'c1', name: 'Videoreceta' }],
    tags: [{ name: 'Arroces' }, { name: 'Mariscos' }],
    ingredients: [
      { value: 1, unitOfMeasurement: '', ingredient: { name: 'Bogavante vivo (600g)' } },
      { value: 200, unitOfMeasurement: 'g', ingredient: { name: 'Arroz bomba' } },
      { value: 1, unitOfMeasurement: 'l', ingredient: { name: 'Fumet de pescado' } },
      { value: 2, unitOfMeasurement: '', ingredient: { name: 'Ñoras' } },
      { value: 1, unitOfMeasurement: 'g', ingredient: { name: 'Azafrán en hebras' } },
    ],
    instructions: [
      'Trocea el bogavante en vivo y sofríe las piezas hasta coger color.',
      'Retira y en el mismo aceite sofríe la ñora hidratada con tomate.',
      'Añade el arroz y náca con el fumet caliente con azafrán.',
      'Incorpora el bogavante. Cocina 18 minutos con el caldo hirviendo suave.',
      'Deja reposar 2 minutos y sirve en el mismo recipiente.',
    ],
  },
  {
    id: 's8',
    name: 'Ensalada de burrata con melocotón y albahaca',
    description: 'Combinación perfecta de temporada: burrata cremosa, melocotón maduro y vinagreta balsámica.',
    cookingTime: 10,
    difficulty: 'EASY',
    isPremium: false,
    servingNumber: 2,
    images: [{ url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80' }],
    author: { firstName: 'Laura', lastName: 'Sánchez', profilePicture: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' } },
    categories: [{ id: 'c3', name: 'Receta' }],
    tags: [{ name: 'Ensaladas' }, { name: 'Verano' }],
    ingredients: [
      { value: 2, unitOfMeasurement: '', ingredient: { name: 'Burratas' } },
      { value: 2, unitOfMeasurement: '', ingredient: { name: 'Melocotones maduros' } },
      { value: 1, unitOfMeasurement: 'manojo', ingredient: { name: 'Albahaca fresca' } },
      { value: 30, unitOfMeasurement: 'ml', ingredient: { name: 'Vinagre balsámico de Módena' } },
      { value: 50, unitOfMeasurement: 'ml', ingredient: { name: 'Aceite de oliva virgen extra' } },
    ],
    instructions: [
      'Parte el melocotón en gajos y disponlo en el plato.',
      'Coloca la burrata en el centro y rómpela ligeramente.',
      'Aliña con aceite, vinagre y sal en escamas.',
      'Decora con hojas de albahaca fresca y pimienta negra.',
    ],
  },
  {
    id: 's9',
    name: 'Pasta fresca al huevo con trufa negra',
    description: 'Tagliatelle casero con mantequilla de trufa negra y parmesano reggiano 36 meses.',
    cookingTime: 45,
    difficulty: 'MEDIUM',
    isPremium: true,
    servingNumber: 2,
    images: [{ url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80' }],
    author: { firstName: 'Ailu', lastName: 'Saraceni', profilePicture: { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' } },
    categories: [{ id: 'c1', name: 'Videoreceta' }],
    tags: [{ name: 'Pastas' }, { name: 'Italiano' }],
    ingredients: [
      { value: 200, unitOfMeasurement: 'g', ingredient: { name: 'Harina 00' } },
      { value: 2, unitOfMeasurement: '', ingredient: { name: 'Huevos enteros' } },
      { value: 30, unitOfMeasurement: 'g', ingredient: { name: 'Trufa negra' } },
      { value: 80, unitOfMeasurement: 'g', ingredient: { name: 'Mantequilla' } },
      { value: 60, unitOfMeasurement: 'g', ingredient: { name: 'Parmesano reggiano' } },
    ],
    instructions: [
      'Mezcla harina y huevos hasta obtener masa elástica. Reposa 30 min.',
      'Estira con rodillo o máquina hasta 2mm. Corta en tagliatelle.',
      'Cuece en agua salada 2-3 minutos.',
      'Saltea en mantequilla fundida, añade trufa rallada y pasta.',
      'Emplatado: sirve con más trufa y parmesano en lascas.',
    ],
  },
  {
    id: 's10',
    name: 'Crema de calabacín con aceite de albahaca',
    description: 'Sopa ligera y verde con calabacín asado, yogur griego y aceite aromático de albahaca.',
    cookingTime: 30,
    difficulty: 'EASY',
    isPremium: false,
    servingNumber: 4,
    images: [{ url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80' }],
    author: { firstName: 'Raquel', lastName: 'Meroño', profilePicture: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' } },
    categories: [{ id: 'c3', name: 'Receta' }],
    tags: [{ name: 'Sopas' }, { name: 'Vegano' }],
    ingredients: [
      { value: 600, unitOfMeasurement: 'g', ingredient: { name: 'Calabacín' } },
      { value: 1, unitOfMeasurement: '', ingredient: { name: 'Cebolla' } },
      { value: 600, unitOfMeasurement: 'ml', ingredient: { name: 'Caldo de verduras' } },
      { value: 1, unitOfMeasurement: 'manojo', ingredient: { name: 'Albahaca fresca' } },
      { value: 80, unitOfMeasurement: 'ml', ingredient: { name: 'Aceite de oliva virgen extra' } },
    ],
    instructions: [
      'Sofríe la cebolla y el calabacín en dados 10 minutos.',
      'Añade el caldo y cocina 15 minutos. Tritura hasta suave.',
      'Prepara el aceite: tritura albahaca con aceite y cuela.',
      'Sirve la crema con un hilo de aceite verde y piñones tostados.',
    ],
  },
  {
    id: 's11',
    name: 'Gyozas de cerdo y jengibre',
    description: 'Empanadillas japonesas crujientes por un lado y tiernas por el otro, con salsa ponzu casera.',
    cookingTime: 50,
    difficulty: 'MEDIUM',
    isPremium: false,
    servingNumber: 4,
    images: [{ url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80' }],
    author: { firstName: 'Sofía', lastName: 'Torres', profilePicture: { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80' } },
    categories: [{ id: 'c3', name: 'Receta' }],
    tags: [{ name: 'Asiático' }, { name: 'Snacks' }],
    ingredients: [
      { value: 300, unitOfMeasurement: 'g', ingredient: { name: 'Carne de cerdo picada' } },
      { value: 200, unitOfMeasurement: 'g', ingredient: { name: 'Col china' } },
      { value: 20, unitOfMeasurement: 'obleas', ingredient: { name: 'Obleas de gyoza' } },
      { value: 1, unitOfMeasurement: 'cs', ingredient: { name: 'Jengibre fresco rallado' } },
      { value: 2, unitOfMeasurement: 'cs', ingredient: { name: 'Salsa de soja' } },
    ],
    instructions: [
      'Mezcla el cerdo, la col picada, el jengibre y la soja.',
      'Coloca una cucharadita del relleno en cada oblea. Dobla y sella haciendo pliegues.',
      'Calienta aceite en sartén antiadherente. Coloca las gyozas planas y dora 2 min.',
      'Añade 80ml de agua, tapa y cocina al vapor 5 minutos.',
      'Sirve con salsa ponzu o soja con aceite de sésamo.',
    ],
  },
  {
    id: 's12',
    name: 'Tarta Tatin de manzana y caramelo salado',
    description: 'La clásica tarta francesa invertida con manzanas caramelizadas y un toque de flor de sal.',
    cookingTime: 55,
    difficulty: 'MEDIUM',
    isPremium: false,
    servingNumber: 6,
    images: [{ url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&q=80' }],
    author: { firstName: 'Laura', lastName: 'Sánchez', profilePicture: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' } },
    categories: [{ id: 'c3', name: 'Receta' }],
    tags: [{ name: 'Postres' }, { name: 'Francés' }],
    ingredients: [
      { value: 6, unitOfMeasurement: '', ingredient: { name: 'Manzanas Golden' } },
      { value: 150, unitOfMeasurement: 'g', ingredient: { name: 'Azúcar' } },
      { value: 80, unitOfMeasurement: 'g', ingredient: { name: 'Mantequilla' } },
      { value: 1, unitOfMeasurement: 'lámina', ingredient: { name: 'Masa hojaldre' } },
      { value: 1, unitOfMeasurement: 'pizca', ingredient: { name: 'Flor de sal' } },
    ],
    instructions: [
      'Pela y parte las manzanas en cuartos. Reserva.',
      'Funde el azúcar con la mantequilla en molde de hierro hasta caramelo dorado.',
      'Coloca las manzanas en el caramelo muy apretadas. Espolvorea flor de sal.',
      'Cubre con la masa hojaldre bien sellada en los bordes.',
      'Hornea a 200°C 30 minutos. Deja reposar 10 min y voltea con cuidado.',
    ],
  },
];

const CHEFS = [
  { name: 'Laura Sánchez', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' },
  { name: 'Raquel Meroño', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { name: 'Sofía Torres', img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80' },
  { name: 'Carlos Maldonado', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { name: 'Ailu Saraceni', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
];

const TRUCOS = [
  { id: 't1', title: 'Aprende baño maría', img: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&q=80' },
  { id: 't2', title: 'Cómo marinar salmón', img: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=300&q=80' },
  { id: 't3', title: 'Todo sobre salteados', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80' },
  { id: 't4', title: 'Cortes básicos de cuchillo', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80' },
];

const ARTICULOS = [
  { id: 'a1', chef: 'Pepe Hernández Castillo', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', title: 'Cómo preparar un picnic para la cita perfecta', time: '7 min' },
  { id: 'a2', chef: 'Pepe Hernández Castillo', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', title: 'Trucos básicos para trabajar con chocolate: consejos para perfeccionar tus postres', time: '7 min' },
];

/* ─── Sub-components ─────────────────────────────────────────── */
const ChefBadge = ({ author }: { author: MCWRecipe['author'] }) => {
  if (!author) return null;
  const name = `${author.firstName} ${author.lastName}`;
  return (
    <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 w-fit">
      {author.profilePicture?.url ? (
        <img src={author.profilePicture.url} alt={name} className="w-4 h-4 rounded-full object-cover" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
      <span className="text-white text-[11px] font-medium">{name}</span>
    </div>
  );
};

const RecipeTag = ({ label }: { label: string }) => (
  <span className="bg-primary/20 border border-primary/40 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
    {label}
  </span>
);

const SectionHead = ({ label, title, counter }: { label?: string; title: string; counter?: string }) => (
  <div className="px-4 pt-6 pb-3">
    {label && <p className="app-caption text-white/40 mb-0.5">{label}</p>}
    <div className="flex items-baseline justify-between">
      <span className="app-section-title">{title}</span>
      {counter && <span className="app-caption text-white/40">{counter}</span>}
    </div>
  </div>
);

/* ─── Detail view ─────────────────────────────────────────────── */
const RecipeDetail = ({ recipe, onBack }: { recipe: MCWRecipe; onBack: () => void }) => {
  const imageUrl = recipe.images?.[0]?.url;
  const authorName = recipe.author ? `${recipe.author.firstName} ${recipe.author.lastName}` : null;
  return (
    <MobileAppLayout showNav={false}>
      <SecondaryHeader onBack={onBack} transparent />
      <div className="pb-10">
        {/* Hero — negative margin to slide under the transparent header */}
        <div className="relative -mt-[calc(48px+var(--sat))]" style={{ height: 320 }}>
          {imageUrl ? (
            <img src={imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-card flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <ChefBadge author={recipe.author} />
            <h1 className="app-heading text-white text-lg leading-tight">{recipe.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {recipe.categories?.[0] && <RecipeTag label={recipe.categories[0].name} />}
              {recipe.cookingTime && (
                <span className="app-caption text-white/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{recipe.cookingTime} min
                </span>
              )}
              {recipe.difficulty && (
                <span className="app-caption text-white/60">{DIFFICULTY_LABEL[recipe.difficulty]}</span>
              )}
              {recipe.isPremium && (
                <span className="flex items-center gap-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-medium">
                  <Star className="w-2.5 h-2.5" />Premium
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 space-y-5 pt-5">
          {recipe.description && (
            <p className="app-body-sm">{recipe.description}</p>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((t, i) => (
                <span key={i} className="text-xs bg-card border border-border rounded-full px-2.5 py-0.5 text-white/50">
                  {t.name}
                </span>
              ))}
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="app-heading mb-3">Ingredientes</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span className="text-white/70">
                      {ing.value > 0 && `${ing.value} `}
                      {ing.unitOfMeasurement && `${ing.unitOfMeasurement} `}
                      <span className="text-white">{ing.ingredient.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="app-heading mb-3">Preparación</h3>
              <ol className="space-y-4">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-white/70 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Author card */}
          {authorName && (
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
              {recipe.author?.profilePicture?.url ? (
                <img src={recipe.author.profilePicture.url} alt={authorName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {recipe.author!.firstName[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{authorName}</p>
                <p className="text-xs text-white/40">Chef</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileAppLayout>
  );
};

/* ─── Main component ─────────────────────────────────────────── */
const AppRecetas = () => {
  const allRecipes: MCWRecipe[] = (recipesRaw as MCWRecipe[]).length > 0
    ? (recipesRaw as MCWRecipe[])
    : SAMPLE_RECIPES;

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<MCWRecipe | null>(null);

  if (selected) {
    return <RecipeDetail recipe={selected} onBack={() => setSelected(null)} />;
  }

  const isSearching = searchQuery.length > 0;

  const filtered = isSearching
    ? allRecipes.filter(r =>
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.tags ?? []).some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const trending = allRecipes.slice(0, 5);
  const forYou = allRecipes.slice(0, 5);
  const featured = allRecipes[1];

  // Search results view
  if (isSearching) {
    return (
      <MobileAppLayout>
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div style={{ height: 'var(--sat)' }} />
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => { setSearchQuery(''); setInputValue(''); }}
              className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-white active:scale-95 transition-transform flex-shrink-0"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <p className="app-body-sm text-white/60 truncate">
              Resultados para <span className="text-white font-medium">"{searchQuery}"</span>
            </p>
          </div>
        </div>
        <div className="px-4 pt-3 pb-6">
          {filtered!.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <ChefHat className="w-10 h-10 text-primary/30" />
              <p className="app-body-sm">No encontramos recetas con ese término.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered!.map(recipe => (
                <button key={recipe.id} onClick={() => setSelected(recipe)}
                  className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-3 text-left">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    {recipe.images?.[0]?.url
                      ? <img src={recipe.images[0].url} alt={recipe.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-primary/10 flex items-center justify-center"><ChefHat className="w-5 h-5 text-primary/30" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="app-heading line-clamp-1">{recipe.name}</p>
                    <p className="app-caption text-white/40 mt-0.5">{recipe.cookingTime} min · {DIFFICULTY_LABEL[recipe.difficulty ?? ''] ?? ''}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <AppHeader />

      <>
          {/* ── Hero ───────────────────────────────────────────── */}
          <div className="relative" style={{ height: 320 }}>
            <img
              src={allRecipes[0]?.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80'}
              alt="Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
              <p className="app-caption text-white/50">Recetas</p>
              <h1 className="text-[1.75rem] font-normal leading-tight text-white" style={{ fontFamily: 'Onest, sans-serif' }}>
                Prepárate para<br />
                <span className="text-primary" style={{ textShadow: '0 0 20px hsl(15 97% 60% / 0.6)' }}>
                  chuparte los dedos
                </span>
              </h1>
              <p className="app-body-sm text-white/60">
                ¿Tus amigos están de camino y no sabes qué cocinar? Cero agobios: aquí encontrarás diferentes platos para cualquier momento.
              </p>
              <form
                className="relative mt-3"
                onSubmit={e => { e.preventDefault(); if (inputValue.trim()) setSearchQuery(inputValue.trim()); }}
              >
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none z-10" />
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Buscar recetas..."
                  enterKeyHint="search"
                  style={{ fontSize: '16px' }}
                  className="w-full bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                />
              </form>
            </div>
          </div>

          {/* ── En tendencia ───────────────────────────────────── */}
          <SectionHead title="En tendencia" counter={`01 — ${trending.length.toString().padStart(2, '0')}`} />
          <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
            {trending.map(recipe => {
              const imgUrl = recipe.images?.[0]?.url;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelected(recipe)}
                  className="flex-shrink-0 w-64 relative rounded-2xl overflow-hidden text-left"
                  style={{ height: 200 }}
                >
                  {imgUrl
                    ? <img src={imgUrl} alt={recipe.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-card" />
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
                    <ChefBadge author={recipe.author} />
                    <p className="app-heading text-white line-clamp-2 leading-snug">{recipe.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {recipe.categories?.[0] && <RecipeTag label={recipe.categories[0].name} />}
                        {recipe.cookingTime && (
                          <span className="app-caption text-white/60 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{recipe.cookingTime} min
                          </span>
                        )}
                        {recipe.difficulty && (
                          <span className="app-caption text-white/60">{DIFFICULTY_LABEL[recipe.difficulty]}</span>
                        )}
                      </div>
                      {recipe.video?.url && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Play className="w-3.5 h-3.5 text-white fill-white" strokeWidth={0} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Trucos y consejos ──────────────────────────────── */}
          <SectionHead label="Por tu nivel de cocina" title="Trucos y consejos" />
          <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
            {TRUCOS.map(truco => (
              <div key={truco.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-24">
                <div className="w-24 h-24 rounded-2xl overflow-hidden">
                  <img src={truco.img} alt={truco.title} className="w-full h-full object-cover" />
                </div>
                <p className="app-caption text-white/60 text-center leading-tight">{truco.title}</p>
              </div>
            ))}
          </div>

          {/* ── Recetas para ti ────────────────────────────────── */}
          <SectionHead title="Recetas para ti" counter={`01 — ${forYou.length.toString().padStart(2, '0')}`} />

          {/* List rows */}
          <div className="px-4 space-y-2">
            {forYou.slice(0, 2).map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelected(recipe)}
                className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-3 text-left"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  {recipe.images?.[0]?.url
                    ? <img src={recipe.images[0].url} alt={recipe.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-primary/10 flex items-center justify-center"><ChefHat className="w-5 h-5 text-primary/30" /></div>
                  }
                </div>
                <p className="app-heading line-clamp-2 flex-1">{recipe.name}</p>
              </button>
            ))}
          </div>

          {/* Featured big card */}
          {featured && (
            <button onClick={() => setSelected(featured)} className="block mx-4 mt-3 w-[calc(100%-2rem)]">
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 220 }}>
                {featured.images?.[0]?.url
                  ? <img src={featured.images[0].url} alt={featured.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-card" />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  <ChefBadge author={featured.author} />
                  <p className="app-heading text-white text-lg line-clamp-2">{featured.name}</p>
                  <div className="flex items-center gap-2">
                    {featured.categories?.[0] && <RecipeTag label={featured.categories[0].name} />}
                    {featured.cookingTime && (
                      <span className="app-caption text-white/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{featured.cookingTime} min
                      </span>
                    )}
                    {featured.difficulty && (
                      <span className="app-caption text-white/60">{DIFFICULTY_LABEL[featured.difficulty]}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* ── Cocineros, a leer! ─────────────────────────────── */}
          <SectionHead title="Cocineros, a leer!" />
          <div className="px-4 space-y-3">
            {ARTICULOS.map(art => (
              <div key={art.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img src={art.img} alt={art.chef} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-xs text-white/60 font-medium">{art.chef}</span>
                  </div>
                  <Bookmark className="w-4 h-4 text-white/30" />
                </div>
                <p className="app-heading line-clamp-2 leading-snug mb-2">{art.title}</p>
                <div className="flex items-center gap-2">
                  <span className="app-caption text-white/40 bg-white/5 rounded-full px-2.5 py-0.5">Artículo</span>
                  <span className="app-caption text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{art.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Nuestros chefs ─────────────────────────────────── */}
          <SectionHead title="Nuestros chefs" />
          <div className="px-4 pb-6">
            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              {CHEFS.map((chef, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                    <img src={chef.img} alt={chef.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="app-caption text-white/60 text-center leading-tight">{chef.name}</p>
                </div>
              ))}
            </div>
          </div>
      </>
    </MobileAppLayout>
  );
};

export default AppRecetas;
