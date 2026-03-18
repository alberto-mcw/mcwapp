import { cn } from "@/lib/utils";
import logoHorizontal from "@/assets/logo-horizontal.png";
import logoMSymbol from "@/assets/logo-m-masterchef.svg";
import manopolaImg from "@/assets/manopla.png";

interface MasterChefLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "horizontal" | "vertical";
}

export const MasterChefLogo = ({ className, size = "md", variant = "horizontal" }: MasterChefLogoProps) => {
  const horizontalSizes = {
    sm: "h-8",
    md: "h-14",
    lg: "h-16",
  };

  const verticalSizes = {
    sm: "h-16",
    md: "h-24",
    lg: "h-32",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const subTextSizes = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  if (variant === "vertical") {
    return (
      <div className={cn("flex flex-col items-center gap-1", className)}>
        <img
          src={logoMSymbol}
          alt="MasterChef"
          className={cn(verticalSizes[size], "w-auto object-contain")}
        />
        <span className={cn(textSizes[size], "font-display font-black text-foreground leading-none tracking-tight")}>
          el<span className="text-primary italic">Reto</span>
        </span>
        <span className={cn(subTextSizes[size], "text-primary font-body tracking-widest uppercase leading-none")}>
          MasterChefWorld <span className="font-semibold">app</span>
        </span>
      </div>
    );
  }

  return (
    <img 
      src={logoHorizontal}
      alt="MasterChef World App - El Reto"
      className={cn(horizontalSizes[size], "w-auto object-contain", className)}
    />
  );
};

export const Manopla = ({ className }: { className?: string }) => {
  return (
    <img
      src={manopolaImg}
      alt="Manopla Naranja"
      className={cn("w-full h-full object-contain", className)}
    />
  );
};
