import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Email no válido").max(255);

export default function RecetarioCaptura() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!consent) {
      toast.error("Debes aceptar la política de privacidad");
      return;
    }

    setLoading(true);
    try {
      // Insert or get existing lead
      const { data: existingLead } = await supabase
        .from("recetario_leads")
        .select("id")
        .eq("email", parsed.data)
        .maybeSingle();

      let leadId: string;

      if (existingLead) {
        leadId = existingLead.id;
      } else {
        const { data: newLead, error } = await supabase
          .from("recetario_leads")
          .insert({
            email: parsed.data,
            source: searchParams.get("utm_source") ? "manychat" : "direct",
            utm_source: searchParams.get("utm_source"),
            utm_medium: searchParams.get("utm_medium"),
            utm_campaign: searchParams.get("utm_campaign"),
            referred_by: searchParams.get("ref") || null,
          })
          .select("id")
          .single();

        if (error) throw error;
        leadId = newLead.id;
      }

      // Store lead info in sessionStorage for the upload step
      sessionStorage.setItem("recetario_lead_id", leadId);
      sessionStorage.setItem("recetario_email", parsed.data);

      navigate("/recetario/subir");
    } catch (err: any) {
      console.error(err);
      toast.error("Error al registrar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-[#C75B2A]" />
        <span className="font-serif text-lg font-bold text-[#3D2B1F]">El Recetario Eterno</span>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#E8D5C4]">
            <div className="w-14 h-14 bg-[#C75B2A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-[#C75B2A]" />
            </div>

            <h1 className="font-serif text-2xl font-bold text-center text-[#3D2B1F] mb-2">
              Un paso más para preservar tu receta
            </h1>
            <p className="text-center text-[#6B5744] text-sm mb-8">
              Déjanos tu email y te enviaremos tu recetario en PDF. Tu receta quedará guardada para siempre.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-[#E8D5C4] bg-[#FFF8F0] text-[#3D2B1F] placeholder:text-[#8B7355]/50 focus-visible:ring-[#C75B2A]"
                  required
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5 border-[#C75B2A] data-[state=checked]:bg-[#C75B2A]"
                />
                <label htmlFor="consent" className="text-xs text-[#6B5744] leading-relaxed cursor-pointer">
                  Acepto recibir mi recetario por email y la{" "}
                  <span className="underline">política de privacidad</span>. Tus datos están protegidos bajo el RGPD.
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#C75B2A] hover:bg-[#A04520] text-white rounded-full text-base font-medium shadow-lg shadow-[#C75B2A]/20"
              >
                {loading ? "Registrando..." : "Acceder al digitalizador"}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="flex items-center gap-2 justify-center mt-6 text-xs text-[#8B7355]">
              <Lock className="w-3.5 h-3.5" />
              <span>Tu email está seguro. Sin spam, lo prometemos.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
