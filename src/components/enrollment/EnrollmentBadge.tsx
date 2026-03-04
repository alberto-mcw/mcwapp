import { CheckCircle2 } from 'lucide-react';

export const EnrollmentBadge = () => {
  const now = new Date();
  const year = now.getFullYear();
  const seasonEnd = new Date(year, 11, 31, 23, 59, 59);

  if (now > seasonEnd) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
      <span className="text-sm font-medium text-primary">
        Participas en "El Reto" {year}
      </span>
    </div>
  );
};
