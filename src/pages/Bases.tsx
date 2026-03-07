import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Quién puede participar?",
    answer: "Pueden participar todas las personas mayores de 18 años residentes en España que tengan pasión por la cocina. No es necesario ser profesional, solo tener ganas de aprender y competir.",
  },
  {
    question: "¿Cómo funciona el sistema de puntos?",
    answer: "Los puntos son la moneda del Reto. Se acumulan completando mini retos diarios, interactuando con la comunidad, participando en desafíos semanales, asistiendo a directos y recibiendo donaciones de otros usuarios. Cuantos más puntos acumules, mejor será tu posición en el ranking.",
  },
  {
    question: "¿Qué es la Manopla Digital?",
    answer: "La Manopla Digital es tu símbolo de entrada al juego. Se activa tras subir tu vídeo de presentación y representa tu compromiso con el Reto. Es tu credencial de participante activo.",
  },
  {
    question: "¿Cómo funciona el ranking?",
    answer: "El ranking se actualiza en tiempo real basándose en los puntos acumulados. Tu posición determina tu acceso a experiencias exclusivas: Top 1.000 recibe la Caja Misteriosa, Top 100 accede al evento presencial, y el Top 5 vive la MasterChef Experience.",
  },
  {
    question: "¿Qué es la Caja Misteriosa?",
    answer: "Es el primer gran hito del Reto. Solo los 1.000 participantes con más puntos recibirán una Caja Misteriosa exclusiva con contenido especial relacionado con MasterChef.",
  },
  {
    question: "¿Qué incluye la MasterChef Experience?",
    answer: "La MasterChef Experience es el premio definitivo para los 5 finalistas. Incluye una experiencia inmersiva en el mundo MasterChef que se revelará a los ganadores.",
  },
  {
    question: "¿Puedo perder energía?",
    answer: "La energía acumulada se conserva, pero la inactividad prolongada puede afectar tu posición relativa si otros participantes siguen sumando. Por eso decimos: el ranking nunca duerme.",
  },
  {
    question: "¿Necesito la app para participar?",
    answer: "Sí, todo el ecosistema del Reto vive en la app de MasterChef World. Desde ahí podrás ver tu energía, el ranking, recibir avisos, participar en directos y completar retos.",
  },
];

const Bases = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Información Legal
              </span>
            </div>
            
            <h1 className="font-unbounded text-4xl md:text-6xl font-black uppercase mb-4">
              Bases del<br />
              <span className="text-gradient">Concurso</span>
            </h1>
            
            <p className="text-muted-foreground max-w-xl mx-auto">
              Todo lo que necesitas saber para participar en El Reto 2026.
            </p>
          </div>

          {/* Legal Document Link */}
          <div className="max-w-2xl mx-auto mb-12">
            <a 
              href="#" 
              className="flex items-center justify-between bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold">Bases Legales Completas</p>
                  <p className="text-sm text-muted-foreground">PDF · 245 KB</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors -rotate-90" />
            </a>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="font-unbounded text-2xl font-bold mb-6 text-center">
              Preguntas Frecuentes
            </h2>
            
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Bases;
