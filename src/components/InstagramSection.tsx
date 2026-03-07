import { Instagram, Zap, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const InstagramSection = () => {
  const instagramUsername = "mchefworldapp";
  const instagramUrl = `https://www.instagram.com/${instagramUsername}`;
  
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  const handleVerifyFollow = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Por favor, introduce un email válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("social_verifications")
        .insert({
          user_email: email.toLowerCase().trim(),
          platform: "instagram",
          action_type: "follow",
          energy_earned: 50,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Ya verificaste tu follow",
            description: "Este email ya tiene los puntos de Instagram",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setIsVerified(true);
        toast({
          title: "¡+50 Energía!",
          description: "Has verificado tu follow a @mchefworldapp",
        });
      }
    } catch (error) {
      console.error("Error verifying follow:", error);
      toast({
        title: "Error",
        description: "No se pudo verificar. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative py-20 px-4 bg-background overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Instagram className="w-4 h-4" />
            Síguenos en Instagram
          </div>
          <h2 className="section-title mb-4">
            Únete a la <span className="text-gradient-primary">comunidad</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Descubre recetas, retos virales y contenido exclusivo. 
            ¡Comparte tus platos con #ElReto2026!
          </p>
        </div>

        {/* Instagram Embed Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <a
              key={i}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square bg-muted border border-border rounded-xl overflow-hidden group relative hover:border-primary/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-foreground/60 backdrop-blur-sm p-4 rounded-full">
                  <Instagram className="w-8 h-8 text-background" />
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                <span className="text-4xl">🍳</span>
              </div>
            </a>
          ))}
        </div>

        {/* Verify Follow Card */}
        <div className="max-w-md mx-auto mb-10">
          <div className="feature-panel border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Verifica tu follow</h3>
                  <p className="text-sm text-muted-foreground">Gana energía extra</p>
                </div>
                <div className="ml-auto flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary">+50</span>
                </div>
              </div>

              {isVerified ? (
                <div className="flex items-center gap-2 justify-center py-4 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-bold">¡Verificado! +50 Energía</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    1. Sigue a <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">@{instagramUsername}</a>
                    <br />
                    2. Introduce tu email para verificar
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={handleVerifyFollow}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 border-0"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verificar"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button 
            asChild 
            size="lg" 
            className="gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 border-0"
          >
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
              <Instagram className="w-5 h-5" />
              Seguir @{instagramUsername}
            </a>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Usa <span className="text-primary font-bold">#ElReto2026</span> para aparecer en nuestro feed
          </p>
        </div>
      </div>
    </section>
  );
};
