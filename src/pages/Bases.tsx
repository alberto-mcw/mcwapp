import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Bases = () => {
  const { t } = useTranslation();

  const faqs = [
    { question: t('bases.q1'), answer: t('bases.a1') },
    { question: t('bases.q2'), answer: t('bases.a2') },
    { question: t('bases.q3'), answer: t('bases.a3') },
    { question: t('bases.q4'), answer: t('bases.a4') },
    { question: t('bases.q5'), answer: t('bases.a5') },
    { question: t('bases.q6'), answer: t('bases.a6') },
    { question: t('bases.q7'), answer: t('bases.a7') },
    { question: t('bases.q8'), answer: t('bases.a8') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {t('bases.badge')}
              </span>
            </div>
            
            <h1 className="font-unbounded text-4xl md:text-6xl font-black uppercase mb-4">
              {t('bases.title1')}<br />
              <span className="text-gradient">{t('bases.title2')}</span>
            </h1>
            
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('bases.subtitle')}
            </p>
          </div>

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
                  <p className="font-bold">{t('bases.legalDoc')}</p>
                  <p className="text-sm text-muted-foreground">PDF · 245 KB</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors -rotate-90" />
            </a>
          </div>

          <div className="max-w-2xl mx-auto">
            <h2 className="font-unbounded text-2xl font-bold mb-6 text-center">
              {t('bases.faqTitle')}
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
