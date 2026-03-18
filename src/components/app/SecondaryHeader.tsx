import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface SecondaryHeaderProps {
  title?: string;
  rightAction?: ReactNode;
  onBack?: () => void;
}

export const SecondaryHeader = ({ title, rightAction, onBack }: SecondaryHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border/40">
      {/* iOS safe area spacer */}
      <div className="bg-background" style={{ height: 'var(--sat)' }} />
      <div className="flex items-center justify-between py-3 px-4 min-h-[48px]">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-white active:scale-95 transition-transform"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        {title && (
          <span className="text-sm font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
            {title}
          </span>
        )}
        <div className="w-9">
          {rightAction}
        </div>
      </div>
    </header>
  );
};
