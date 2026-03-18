import concentricSvg from '@/assets/concentric-circles.svg';

/**
 * Full-screen black background with the brand concentric circles SVG.
 * Wrap your page content inside this component.
 */
export const ConcentricBg = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen bg-black overflow-hidden">
    {/* Concentric circles — centered, covers most of screen */}
    <img
      src={concentricSvg}
      alt=""
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-[200vw] max-w-[900px]"
      style={{ top: '-10%' }}
    />
    {/* Content above the circles */}
    <div className="relative z-10 min-h-screen flex flex-col">
      {children}
    </div>
  </div>
);
