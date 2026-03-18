import { cn } from "@/lib/utils";
import logoHorizontal from "@/assets/logo-horizontal.png";
import manopolaImg from "@/assets/manopla.png";

interface MasterChefLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "horizontal" | "vertical";
}

export const MasterChefLogo = ({ className, size = "md", variant = "horizontal" }: MasterChefLogoProps) => {
  const sizes = {
    sm: "h-8",
    md: "h-14",
    lg: "h-20",
  };

  return (
    <img
      src={logoHorizontal}
      alt="MasterChef World App - El Reto"
      className={cn(sizes[size], "w-auto object-contain", className)}
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
