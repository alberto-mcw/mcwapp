import { useState, useEffect } from "react";

export const EmotionalCounter = () => {
  // Animated counter that just ticks without a real date
  const [ticks, setTicks] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    // Pick a fake "target" ~47 days from page load for visual tension
    const target = Date.now() + 47 * 24 * 60 * 60 * 1000;

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTicks({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const units = [
    { label: "Días", value: ticks.d },
    { label: "Horas", value: ticks.h },
    { label: "Min", value: ticks.m },
    { label: "Seg", value: ticks.s },
  ];

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container max-w-3xl mx-auto text-center">
        <p className="text-sm text-muted-foreground tracking-widest uppercase mb-8">
          El Reto 2026 empieza antes de lo que crees
        </p>

        <div className="flex items-center justify-center gap-3 md:gap-6">
          {units.map((u, i) => (
            <div key={u.label} className="flex items-center gap-3 md:gap-6">
              <div className="flex flex-col items-center">
                <span className="text-4xl md:text-6xl font-black tabular-nums text-foreground leading-none">
                  {String(u.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mt-2">
                  {u.label}
                </span>
              </div>
              {i < units.length - 1 && (
                <span className="text-2xl md:text-4xl font-light text-muted-foreground/30 -mt-4">:</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
