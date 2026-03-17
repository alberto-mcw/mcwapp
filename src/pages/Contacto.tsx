import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const Contacto = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {t('contacto.badge')}
              </span>
            </div>
            
            <h1 className="font-unbounded text-4xl md:text-6xl font-black uppercase mb-4">
              {t('contacto.title1')}<br />
              <span className="text-gradient">{t('contacto.title2')}</span>
            </h1>
            
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('contacto.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="font-unbounded text-xl font-bold mb-6">
                {t('contacto.sendMessage')}
              </h2>
              
              <form className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('contacto.name')}</label>
                    <Input placeholder={t('contacto.namePlaceholder')} className="bg-secondary/50 border-border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('common.email')}</label>
                    <Input type="email" placeholder={t('auth.emailPlaceholder')} className="bg-secondary/50 border-border" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('contacto.subject')}</label>
                  <Input placeholder={t('contacto.subjectPlaceholder')} className="bg-secondary/50 border-border" />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('contacto.message')}</label>
                  <Textarea placeholder={t('contacto.messagePlaceholder')} className="bg-secondary/50 border-border min-h-[150px]" />
                </div>
                
                <Button type="submit" size="lg" className="w-full">
                  {t('contacto.sendButton')}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{t('contacto.supportEmail')}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{t('contacto.supportEmailDesc')}</p>
                    <a href="mailto:elreto@masterchefworld.com" className="text-primary hover:underline">
                      elreto@masterchefworld.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{t('contacto.helpCenter')}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{t('contacto.helpCenterDesc')}</p>
                    <a href="/bases" className="text-primary hover:underline">{t('contacto.viewFaq')}</a>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-6">
                <h3 className="font-unbounded font-bold mb-2">{t('contacto.technicalIssues')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('contacto.technicalDesc')}</p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• {t('contacto.techItem1')}</li>
                  <li>• {t('contacto.techItem2')}</li>
                  <li>• {t('contacto.techItem3')}</li>
                  <li>• {t('contacto.techItem4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contacto;
