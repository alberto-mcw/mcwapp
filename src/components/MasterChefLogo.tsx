import { cn } from "@/lib/utils";
import logoHorizontal from "@/assets/logo-horizontal.png";
import logoVertical from "@/assets/logo-elreto-vertical.svg";
import manopolaImg from "@/assets/manopla.png";

interface MasterChefLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "horizontal" | "vertical";
}

export const MasterChefLogo = ({ className, size = "md", variant = "horizontal" }: MasterChefLogoProps) => {
  const horizontalSizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };

  const verticalSizes = {
    sm: "h-20",
    md: "h-32",
    lg: "h-48",
  };

  const isVertical = variant === "vertical";
  const sizeClasses = isVertical ? verticalSizes : horizontalSizes;
  const logo = isVertical ? logoVertical : logoHorizontal;

  return (
    <img 
      src={logo}
      alt="MasterChef World App"
      className={cn(sizeClasses[size], "w-auto object-contain", className)}
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
