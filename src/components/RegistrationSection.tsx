import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Manopla } from "./MasterChefLogo";
import { ChevronRight, Check } from "lucide-react";
import { LegalCheckboxes } from "./LegalCheckboxes";

const profiles = [
  { value: "cocino", label: "Cocino" },
  { value: "sigo", label: "Sigo el Reto" },
  { value: "creo", label: "Creo contenido" },
  { value: "marca", label: "Marca / Partner" },
];

export const RegistrationSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profile: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.profile || !acceptTerms || !acceptPrivacy) return;
    setSubmitted(true);
  };

  return (
    <section id="registro" className="relative py-24 px-4 bg-background overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="container max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="badge-primary mb-4 inline-block">Acceso anticipado</span>
          <h2 className="section-title mb-3">
            Reserva tu <span className="text-gradient-primary">sitio</span>
          </h2>
          <p className="text-sm text-muted-foreground font-body">
            Cuanto antes entres, más ventaja tienes.
          </p>
        </div>

        {submitted ? (
          /* Success State */
          <div className="text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary glow-warm-intense mb-6">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Estás dentro.</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Muy pronto recibirás tu primer reto.
            </p>
            <div className="inline-flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <Manopla className="w-4 h-4" />
              <span className="italic">La manopla ya está en juego</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="feature-panel p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold tracking-wider mb-2 text-foreground uppercase">
                    Nombre
                  </label>
                  <Input
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-muted/50 border-border h-12 text-base placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-wider mb-2 text-foreground uppercase">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-muted/50 border-border h-12 text-base placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary"
                    required
                    maxLength={255}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-wider mb-2 text-foreground uppercase">
                    Perfil
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {profiles.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, profile: p.value })}
                        className={`text-xs font-medium py-3 px-4 rounded-xl border transition-all ${
                          formData.profile === p.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="btn-primary w-full py-6 text-base font-bold"
              disabled={!formData.name || !formData.email || !formData.profile}
            >
              Reservar mi sitio
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>

            <p className="text-center text-[10px] text-muted-foreground">
              Al registrarte aceptas los{" "}
              <a href="/bases" className="text-primary hover:underline">términos</a>
              {" "}y la{" "}
              <a href="#" className="text-primary hover:underline">política de privacidad</a>.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};
