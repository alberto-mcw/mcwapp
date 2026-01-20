import { MapPin } from "lucide-react";

const events = [
  {
    city: "Madrid",
    region: "madrid",
    x: 48,
    y: 52,
    events: [
      { name: "Fase 0", date: "Mayo" },
      { name: "Gran Final", date: "Diciembre" },
    ],
  },
  {
    city: "Valencia",
    region: "valencia",
    x: 65,
    y: 58,
    events: [{ name: "Bloque 01", date: "Junio" }],
  },
  {
    city: "Sevilla",
    region: "andalucia",
    x: 32,
    y: 78,
    events: [
      { name: "Bloque 02", date: "Septiembre" },
      { name: "Semifinales", date: "Diciembre" },
    ],
  },
  {
    city: "Santander",
    region: "cantabria",
    x: 42,
    y: 22,
    events: [{ name: "Bloque 03", date: "Noviembre" }],
  },
];

export const SpainEventsMap = () => {
  return (
    <div className="mb-12">
      <h2 className="font-unbounded text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
        <MapPin className="w-6 h-6 text-primary" />
        Eventos Presenciales
      </h2>

      <div className="relative max-w-3xl mx-auto">
        {/* SVG Map of Spain with autonomous communities */}
        <svg
          viewBox="0 0 100 90"
          className="w-full h-auto"
          style={{ filter: "drop-shadow(0 4px 20px rgba(249, 115, 22, 0.2))" }}
        >
          {/* Background glow */}
          <defs>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Simplified Spain map outline with regions */}
          <g className="spain-regions" fill="url(#mapGradient)" stroke="hsl(var(--primary))" strokeWidth="0.3">
            {/* Galicia */}
            <path d="M10,20 L18,15 L22,18 L20,28 L12,30 L8,25 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Asturias */}
            <path d="M22,18 L32,15 L35,20 L30,25 L20,28 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Cantabria */}
            <path d="M35,20 L45,18 L48,22 L42,26 L35,25 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* País Vasco */}
            <path d="M48,18 L55,16 L58,20 L52,24 L48,22 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Navarra */}
            <path d="M55,16 L62,18 L65,25 L58,28 L52,24 L58,20 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* La Rioja */}
            <path d="M48,26 L55,24 L58,28 L52,32 L46,30 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Aragón */}
            <path d="M58,28 L65,25 L75,22 L78,35 L72,48 L62,45 L55,38 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Cataluña */}
            <path d="M75,22 L85,18 L92,25 L88,38 L78,35 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Castilla y León */}
            <path d="M20,28 L30,25 L42,26 L48,26 L55,24 L58,28 L55,38 L48,42 L38,45 L25,42 L18,35 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Madrid */}
            <path d="M42,45 L52,42 L55,48 L52,55 L45,55 L40,50 Z" className="hover:fill-primary/40 transition-colors cursor-pointer" />
            
            {/* Castilla-La Mancha */}
            <path d="M38,45 L48,42 L55,48 L62,45 L72,48 L75,55 L72,65 L55,68 L42,65 L35,55 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Comunidad Valenciana */}
            <path d="M72,48 L78,35 L88,38 L85,50 L78,62 L72,65 L75,55 Z" className="hover:fill-primary/40 transition-colors cursor-pointer" />
            
            {/* Murcia */}
            <path d="M65,68 L72,65 L78,62 L75,72 L68,75 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Extremadura */}
            <path d="M18,45 L25,42 L38,45 L35,55 L42,65 L35,70 L22,68 L15,58 Z" className="hover:fill-primary/40 transition-colors" />
            
            {/* Andalucía */}
            <path d="M15,58 L22,68 L35,70 L42,65 L55,68 L65,68 L68,75 L62,82 L48,85 L30,82 L18,78 L10,70 Z" className="hover:fill-primary/40 transition-colors cursor-pointer" />
          </g>

          {/* Event markers */}
          {events.map((event, index) => (
            <g key={event.city} className="event-marker">
              {/* Pulsing circle */}
              <circle
                cx={event.x}
                cy={event.y}
                r="3"
                fill="hsl(var(--primary))"
                className="animate-pulse"
                opacity="0.5"
              />
              {/* Main marker */}
              <circle
                cx={event.x}
                cy={event.y}
                r="2"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth="0.5"
                filter="url(#glow)"
              />
            </g>
          ))}
        </svg>

        {/* Event labels positioned absolutely */}
        <div className="absolute inset-0 pointer-events-none">
          {events.map((event) => (
            <div
              key={event.city}
              className="absolute pointer-events-auto"
              style={{
                left: `${event.x}%`,
                top: `${event.y}%`,
                transform: event.city === "Santander" ? "translate(-50%, -120%)" : 
                           event.city === "Valencia" ? "translate(10%, -50%)" :
                           event.city === "Sevilla" ? "translate(-110%, -50%)" :
                           "translate(-50%, 20%)",
              }}
            >
              <div className="bg-card/95 backdrop-blur-sm border border-primary/30 rounded-lg p-2 shadow-lg min-w-[120px]">
                <div className="text-xs font-bold text-primary mb-1">{event.city}</div>
                {event.events.map((e, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground leading-tight">
                    <span className="text-foreground font-medium">{e.name}</span>
                    <span className="text-muted-foreground"> • {e.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center mt-6 gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span>Sede del evento</span>
        </div>
      </div>
    </div>
  );
};
