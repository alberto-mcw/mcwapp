import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Calendar, 
  Download, 
  Instagram, 
  LogOut 
} from 'lucide-react';

export const QuickActions = () => {
  const { signOut } = useAuth();

  const actions = [
    { icon: Trophy, label: 'Ver Ranking', href: '/ranking', color: 'text-yellow-500' },
    { icon: Calendar, label: 'Calendario', href: '/calendario', color: 'text-blue-500' },
    { icon: Download, label: 'Descargar App', href: '/descarga', color: 'text-green-500' },
    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/mchefworldapp', external: true, color: 'text-pink-500' },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-unbounded font-bold mb-4">Acciones Rápidas</h3>
      
      <div className="space-y-2">
        {actions.map((action) => (
          action.external ? (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors"
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </a>
          ) : (
            <Link
              key={action.label}
              to={action.href}
              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors"
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          )
        ))}
        
        {/* Logout */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-destructive/10 transition-colors w-full text-left"
        >
          <LogOut className="w-5 h-5 text-destructive" />
          <span className="text-sm font-medium text-destructive">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
