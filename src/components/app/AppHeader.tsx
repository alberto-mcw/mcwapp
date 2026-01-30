import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  className?: string;
}

export const AppHeader = ({ title, subtitle, rightAction, className }: AppHeaderProps) => {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-unbounded text-lg font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {rightAction && (
          <div>{rightAction}</div>
        )}
      </div>
    </header>
  );
};
