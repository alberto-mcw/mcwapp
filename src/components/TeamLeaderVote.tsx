import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Manopla } from "./MasterChefLogo";
import { Check, TrendingUp } from "lucide-react";

interface TeamLeader {
  id: string;
  name: string;
  claim: string;
  image: string;
  color: string;
}

const teamLeaders: TeamLeader[] = [
  {
    id: "leader-1",
    name: "Chef Cortés",
    claim: "Precisión. Estrategia. Sangre fría.",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=500&fit=crop&crop=face",
    color: "from-foreground/80 to-foreground",
  },
  {
    id: "leader-2",
    name: "Chef Valeria",
    claim: "Creatividad sin miedo.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=500&fit=crop&crop=face",
    color: "from-foreground/80 to-foreground",
  },
  {
    id: "leader-3",
    name: "Chef Nakamura",
    claim: "Experiencia bajo presión.",
    image: "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=400&h=500&fit=crop&crop=face",
    color: "from-foreground/80 to-foreground",
  },
  {
    id: "leader-4",
    name: "Chef Fuego",
    claim: "Instinto y espectáculo.",
    image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=400&h=500&fit=crop&crop=face",
    color: "from-foreground/80 to-foreground",
  },
];

// Simulated vote data
const baseVotes: Record<string, number> = {
  "leader-1": 342,
  "leader-2": 289,
  "leader-3": 198,
  "leader-4": 271,
};

const feedbackMessages: Record<string, string> = {
  "leader-1": "Buen ojo. Liderar no es solo cocinar.",
  "leader-2": "La creatividad mueve montañas.",
  "leader-3": "Este Team Leader sabe competir bajo presión.",
  "leader-4": "El instinto no se enseña. Se tiene.",
};

export const TeamLeaderVote = () => {
  const [votedId, setVotedId] = useState<string | null>(null);
  const [showManopla, setShowManopla] = useState(false);
  const [votes, setVotes] = useState(baseVotes);
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotesId = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];

  const handleVote = (leaderId: string) => {
    if (votedId) return;

    setAnimatingCard(leaderId);
    setVotes((prev) => ({ ...prev, [leaderId]: prev[leaderId] + 1 }));

    setTimeout(() => {
      setVotedId(leaderId);
      setAnimatingCard(null);
    }, 400);

    setTimeout(() => {
      setShowManopla(true);
    }, 1000);
  };

  // Persist vote in localStorage
  useEffect(() => {
    const savedVote = localStorage.getItem("teamleader-vote");
    if (savedVote) {
      setVotedId(savedVote);
      setShowManopla(true);
    }
  }, []);

  useEffect(() => {
    if (votedId) {
      localStorage.setItem("teamleader-vote", votedId);
    }
  }, [votedId]);

  return (
    <section id="vote" className="py-24 px-4 bg-card relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container max-w-5xl mx-auto relative z-10">
        {/* Intro */}
        <div className="text-center mb-14">
          <span className="badge-primary mb-4 inline-block">🔥 Experiencia interactiva</span>
          <h2 className="section-title mb-4">
            Vota a tu <span className="text-gradient-primary">Team Leader</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed font-body">
            Un equipo no empieza en la cocina. Empieza con una decisión.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {teamLeaders.map((leader) => {
            const isVoted = votedId === leader.id;
            const isDisabled = votedId !== null && !isVoted;
            const percentage = Math.round((votes[leader.id] / totalVotes) * 100);
            const isLeading = leader.id === maxVotesId && votedId;

            return (
              <div
                key={leader.id}
                className={`relative rounded-2xl overflow-hidden transition-all duration-500 group ${
                  animatingCard === leader.id ? "scale-95" : ""
                } ${isVoted ? "ring-2 ring-primary glow-warm" : ""} ${
                  isDisabled ? "opacity-50 grayscale" : ""
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${leader.color} opacity-60`} />

                  {/* Leading badge */}
                  {isLeading && (
                    <div className="absolute top-3 right-3 animate-fade-in">
                      <Manopla className="w-8 h-8 drop-shadow-lg" />
                    </div>
                  )}

                  {/* Voted check */}
                  {isVoted && (
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                      <Check className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-sm md:text-base font-bold text-primary-foreground mb-1">{leader.name}</h3>
                    <p className="text-[10px] md:text-xs text-primary-foreground/70 italic">{leader.claim}</p>

                    {/* Vote bar (shown after voting) */}
                    {votedId && (
                      <div className="mt-3 animate-fade-in">
                        <div className="flex justify-between text-[10px] text-primary-foreground/80 mb-1">
                          <span>{percentage}%</span>
                          <span>{votes[leader.id]} votos</span>
                        </div>
                        <div className="w-full h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vote button */}
                {!votedId && (
                  <button
                    onClick={() => handleVote(leader.id)}
                    className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-foreground/30 to-transparent"
                  >
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-5 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
                      Votar
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback after vote */}
        {votedId && (
          <div className="text-center animate-slide-up">
            <p className="text-sm text-muted-foreground italic mb-2">
              {feedbackMessages[votedId]}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Así se está formando la comunidad.</span>
            </div>
          </div>
        )}

        {/* Manopla Naranja reveal */}
        {showManopla && (
          <div className="mt-14 text-center animate-slide-up">
            <div className="inline-flex flex-col items-center gap-4 feature-panel p-8 md:p-10">
              <div className="relative animate-pulse-soft">
                <div className="w-20 h-20 rounded-full bg-gradient-primary glow-warm-intense flex items-center justify-center">
                  <Manopla className="w-12 h-12" />
                </div>
              </div>
              <div>
                <p className="text-base md:text-lg font-bold text-foreground mb-1">
                  🟠 Has activado la Manopla Naranja
                </p>
                <p className="text-sm text-muted-foreground">
                  Algunos empiezan mirando. Otros ya están jugando.
                </p>
              </div>
              <div className="mt-2 inline-flex items-center gap-2 badge-primary">
                <Manopla className="w-4 h-4" />
                <span>Manopla Naranja · Nivel 01</span>
              </div>
              <p className="text-xs text-muted-foreground italic mt-1">
                Esta manopla no se regala. Se gana.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
